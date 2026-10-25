// Edge Function appelée par la base (trigger ateliers_alerte_verification, via pg_net) quand un atelier est
// créé ou repasse en « en_verification » : écrit à contact@creazio.fr avec Resend.
//
// L'appel ne transporte que l'identifiant de l'atelier ; tout est relu ici avec la clé service. La colonne
// alerte_verification_envoyee_le (remise à NULL à chaque passage en vérification) garantit un seul email par
// passage : un appel extérieur ne peut rien déclencher d'autre. Le destinataire est fixe.
// Secrets : RESEND_API_KEY (obligatoire), EMAIL_EXPEDITEUR (facultatif).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { DESTINATAIRE, construireEmailAlerte } from "./email.ts";

const EXPEDITEUR_TEST = "Creazio <onboarding@resend.dev>";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reponse = (status: number, corps: Record<string, unknown>) =>
  new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reponse(405, { erreur: "POST attendu" });
  const { atelier_id: id } = (await req.json().catch(() => ({}))) as { atelier_id?: unknown };
  if (typeof id !== "string" || !UUID.test(id)) return reponse(400, { erreur: "atelier_id invalide" });

  const cle = Deno.env.get("RESEND_API_KEY");
  if (!cle) {
    console.error(`[alerte-verification] ${id} : secret RESEND_API_KEY absent, email non envoyé`);
    return reponse(500, { erreur: "RESEND_API_KEY manquant" });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Réserve l'envoi : une seule exécution gagne par passage en vérification.
  const { data: atelier, error } = await supabase
    .from("ateliers")
    .update({ alerte_verification_envoyee_le: new Date().toISOString() })
    .eq("id", id)
    .eq("statut", "en_verification")
    .is("alerte_verification_envoyee_le", null)
    .select("id,titre,prix_public_eur,artisans(nom_commercial)")
    .maybeSingle();
  if (error) {
    console.error(`[alerte-verification] ${id} : lecture impossible : ${error.message}`);
    return reponse(500, { erreur: "lecture de l'atelier impossible" });
  }
  if (!atelier) return reponse(200, { statut: "ignore", raison: "déjà signalé ou pas en vérification" });

  const liberer = async (motif: string) => {
    console.error(`[alerte-verification] ${id} : ${motif}`);
    await supabase.from("ateliers").update({ alerte_verification_envoyee_le: null }).eq("id", id);
  };
  const email = construireEmailAlerte({
    atelierId: atelier.id,
    titre: atelier.titre,
    artisan: (atelier.artisans as unknown as { nom_commercial: string } | null)?.nom_commercial ?? null,
    prixPublicEur: atelier.prix_public_eur == null ? null : Number(atelier.prix_public_eur),
  });
  try {
    const envoi = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_EXPEDITEUR") || EXPEDITEUR_TEST,
        to: [DESTINATAIRE],
        subject: email.sujet,
        html: email.html,
        text: email.texte,
      }),
    });
    const corps = await envoi.text();
    if (!envoi.ok) {
      await liberer(`Resend a refusé l'envoi (${envoi.status}) : ${corps}`);
      return reponse(502, { erreur: "envoi refusé par Resend", statut_resend: envoi.status });
    }
    console.log(`[alerte-verification] ${id} : email envoyé (${corps})`);
    return reponse(200, { statut: "envoye" });
  } catch (e) {
    await liberer(`Resend injoignable : ${e instanceof Error ? e.message : String(e)}`);
    return reponse(502, { erreur: "Resend injoignable" });
  }
});
