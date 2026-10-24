// Edge Function appelée par la base (trigger reservation_confirmee_email, via pg_net) à chaque
// réservation confirmée : envoie l'email « Votre atelier est réservé » à l'élève avec Resend.
//
// L'appel ne transporte que l'identifiant de la réservation ; tout le reste est relu ici avec la clé
// service. La colonne email_confirmation_envoye_le garantit un seul envoi par réservation, et seules les
// réservations de moins d'une heure sont traitées : un appel extérieur ne peut donc rien déclencher d'autre.
// Un échec d'envoi n'annule jamais la réservation : il est écrit dans les logs de la fonction.
//
// Secrets : RESEND_API_KEY (obligatoire), EMAIL_EXPEDITEUR (facultatif, par défaut l'expéditeur de test
// de Resend, qui n'envoie qu'à l'adresse du compte Resend).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { construireEmailConfirmation } from "./email.ts";

const EXPEDITEUR_TEST = "Creazio <onboarding@resend.dev>";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reponse = (status: number, corps: Record<string, unknown>) =>
  new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reponse(405, { erreur: "POST attendu" });
  const { reservation_id: id } = (await req.json().catch(() => ({}))) as { reservation_id?: unknown };
  if (typeof id !== "string" || !UUID.test(id)) return reponse(400, { erreur: "reservation_id invalide" });

  const cle = Deno.env.get("RESEND_API_KEY");
  if (!cle) {
    console.error(`[confirmation] ${id} : secret RESEND_API_KEY absent, email non envoyé`);
    return reponse(500, { erreur: "RESEND_API_KEY manquant" });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Réserve l'envoi : une seule exécution gagne, les appels suivants ne font rien.
  const { data: resa, error: erreurReservation } = await supabase
    .from("reservations")
    .update({ email_confirmation_envoye_le: new Date().toISOString() })
    .eq("id", id)
    .eq("statut", "confirmee")
    .is("email_confirmation_envoye_le", null)
    .gt("reservee_le", new Date(Date.now() - 3_600_000).toISOString())
    .select(
      "id,code_creazio,credits_debites,profiles(prenom,email),sessions(debut_le,fin_le,ateliers(titre,adresse_ligne,code_postal,ville,artisans(nom_commercial)))",
    )
    .maybeSingle();
  if (erreurReservation) {
    console.error(`[confirmation] ${id} : lecture impossible : ${erreurReservation.message}`);
    return reponse(500, { erreur: "lecture de la réservation impossible" });
  }
  if (!resa) return reponse(200, { statut: "ignore", raison: "déjà envoyé, ancienne ou non confirmée" });

  const eleve = resa.profiles as unknown as { prenom: string; email: string } | null;
  const session = resa.sessions as unknown as {
    debut_le: string;
    fin_le: string;
    ateliers: {
      titre: string;
      adresse_ligne: string;
      code_postal: string;
      ville: string;
      artisans: { nom_commercial: string } | null;
    } | null;
  } | null;
  const atelier = session?.ateliers;
  // Échec : on le journalise et on libère l'envoi (la réservation, elle, reste confirmée).
  const noterEchecEnvoi = async (motif: string) => {
    console.error(`[confirmation] ${id} : ${motif}`);
    await supabase.from("reservations").update({ email_confirmation_envoye_le: null }).eq("id", id);
  };
  if (!eleve?.email || !session || !atelier) {
    await noterEchecEnvoi("données incomplètes (email, session ou atelier introuvable)");
    return reponse(500, { erreur: "données incomplètes" });
  }

  const { data: parametres } = await supabase
    .from("parametres_plateforme")
    .select("delai_annulation_gratuite_heures")
    .maybeSingle();
  const email = construireEmailConfirmation({
    prenom: eleve.prenom,
    atelier: atelier.titre,
    artisan: atelier.artisans?.nom_commercial ?? null,
    debutLe: session.debut_le,
    finLe: session.fin_le,
    adresse: `${atelier.adresse_ligne}, ${atelier.code_postal} ${atelier.ville}`,
    creditsDebites: resa.credits_debites,
    codeCreazio: resa.code_creazio,
    delaiAnnulationHeures: parametres?.delai_annulation_gratuite_heures ?? 48,
  });

  try {
    const envoi = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_EXPEDITEUR") || EXPEDITEUR_TEST,
        to: [eleve.email],
        subject: email.sujet,
        html: email.html,
        text: email.texte,
      }),
    });
    const corps = await envoi.text();
    if (!envoi.ok) {
      await noterEchecEnvoi(`Resend a refusé l'envoi (${envoi.status}) : ${corps}`);
      return reponse(502, { erreur: "envoi refusé par Resend", statut_resend: envoi.status });
    }
    console.log(`[confirmation] ${id} : email envoyé (${corps})`);
    return reponse(200, { statut: "envoye" });
  } catch (e) {
    await noterEchecEnvoi(`Resend injoignable : ${e instanceof Error ? e.message : String(e)}`);
    return reponse(502, { erreur: "Resend injoignable" });
  }
});
