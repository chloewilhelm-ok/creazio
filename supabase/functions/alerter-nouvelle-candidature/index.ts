// Edge Function appelée par la base (trigger artisans_alerte_candidature, via pg_net) à chaque nouvelle
// candidature artisan « en_attente » : écrit à contact@creazio.fr avec Resend.
//
// L'appel ne transporte que l'identifiant du profil ; tout est relu ici avec la clé service. La colonne
// alerte_candidature_envoyee_le garantit un seul email par candidature, et seules les candidatures de moins
// d'une heure sont traitées : un appel extérieur ne peut rien déclencher d'autre. Le destinataire est fixe.
// Un échec d'envoi ne touche pas à la candidature : il est écrit dans les logs et le verrou est libéré.
// Secrets : RESEND_API_KEY (obligatoire), EMAIL_EXPEDITEUR (facultatif).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { DESTINATAIRE, construireEmailCandidature } from "./email.ts";

const EXPEDITEUR_TEST = "Creazio <onboarding@resend.dev>";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reponse = (status: number, corps: Record<string, unknown>) =>
  new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reponse(405, { erreur: "POST attendu" });
  const { profile_id: id } = (await req.json().catch(() => ({}))) as { profile_id?: unknown };
  if (typeof id !== "string" || !UUID.test(id)) return reponse(400, { erreur: "profile_id invalide" });

  const cle = Deno.env.get("RESEND_API_KEY");
  if (!cle) {
    console.error(`[alerte-candidature] ${id} : secret RESEND_API_KEY absent, email non envoyé`);
    return reponse(500, { erreur: "RESEND_API_KEY manquant" });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Réserve l'envoi : une seule exécution gagne, pour une candidature récente et toujours en attente.
  const { data: candidature, error } = await supabase
    .from("artisans")
    .update({ alerte_candidature_envoyee_le: new Date().toISOString() })
    .eq("profile_id", id)
    .eq("statut_candidature", "en_attente")
    .is("alerte_candidature_envoyee_le", null)
    .gt("cree_le", new Date(Date.now() - 3_600_000).toISOString())
    .select("profile_id,nom_commercial,savoir_faire_principal,ville,cree_le,profiles(prenom)")
    .maybeSingle();
  if (error) {
    console.error(`[alerte-candidature] ${id} : lecture impossible : ${error.message}`);
    return reponse(500, { erreur: "lecture de la candidature impossible" });
  }
  if (!candidature) return reponse(200, { statut: "ignore", raison: "déjà signalée, ancienne ou plus en attente" });

  const liberer = async (motif: string) => {
    console.error(`[alerte-candidature] ${id} : ${motif}`);
    await supabase.from("artisans").update({ alerte_candidature_envoyee_le: null }).eq("profile_id", id);
  };
  const email = construireEmailCandidature({
    profileId: candidature.profile_id,
    nomAtelier: candidature.nom_commercial,
    prenom: (candidature.profiles as unknown as { prenom: string | null } | null)?.prenom ?? null,
    savoirFaire: candidature.savoir_faire_principal,
    ville: candidature.ville,
    creeLe: candidature.cree_le,
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
    console.log(`[alerte-candidature] ${id} : email envoyé (${corps})`);
    return reponse(200, { statut: "envoye" });
  } catch (e) {
    await liberer(`Resend injoignable : ${e instanceof Error ? e.message : String(e)}`);
    return reponse(502, { erreur: "Resend injoignable" });
  }
});
