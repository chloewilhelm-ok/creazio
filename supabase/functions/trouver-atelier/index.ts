// Edge Function « trouver-atelier » : l'élève décrit son envie en une phrase, Gemini choisit jusqu'à
// 3 ateliers parmi ceux qui ont réellement des places, et le serveur vérifie la réponse.
//
// Règles : réservé aux élèves connectés (jeton vérifié) ; 10 demandes par heure et par élève
// (consommer_quota_ia) ; seuls la phrase, la zone (arrondissement ou ville) et la liste des ateliers
// disponibles partent chez Google. Secret requis : GEMINI_API_KEY.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import {
  DELAI_GEMINI_MS,
  LIBELLES_SAVOIR_FAIRE,
  LIMITE_PAR_HEURE,
  MODELE_GEMINI,
  ateliersDisponibles,
  nettoyerPhrase,
  requeteGemini,
  validerReponse,
  zoneDepuisAdresse,
  type SessionDisponible,
} from "./logique.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reponse = (status: number, corps: Record<string, unknown>) =>
  new Response(JSON.stringify(corps), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const JOURS_RECHERCHE = 45;
class ErreurGemini extends Error {
  constructor(public statut: number, message: string) {
    super(message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return reponse(405, { code: "METHODE", erreur: "POST attendu" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // 1. Qui demande ? Uniquement un élève connecté.
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await admin.auth.getUser(jeton);
  if (!auth?.user) return reponse(401, { code: "NON_CONNECTE", erreur: "Connexion requise" });
  const { data: profil } = await admin
    .from("profiles")
    .select("role, code_postal, ville")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profil?.role !== "eleve") return reponse(403, { code: "ROLE_INTERDIT", erreur: "Réservé aux élèves" });

  // 2. La demande.
  const phrase = nettoyerPhrase(((await req.json().catch(() => ({}))) as { phrase?: unknown }).phrase);
  if (!phrase) return reponse(400, { code: "PHRASE_VIDE", erreur: "Décrivez votre envie en quelques mots" });

  // 3. Quota : 10 demandes par heure.
  const { data: restantes, error: erreurQuota } = await admin.rpc("consommer_quota_ia", {
    p_eleve: auth.user.id,
    p_limite: LIMITE_PAR_HEURE,
  });
  if (erreurQuota) {
    console.error(`[trouver-atelier] quota illisible : ${erreurQuota.message}`);
    return reponse(500, { code: "ERREUR", erreur: "Service indisponible" });
  }
  if (restantes === -1) return reponse(429, { code: "QUOTA", erreur: `Limite de ${LIMITE_PAR_HEURE} demandes par heure atteinte` });

  // 4. Ateliers réellement disponibles : publiés, créneau ouvert à venir avec des places restantes.
  const maintenant = new Date();
  const { data: lignes, error: erreurSessions } = await admin
    .from("sessions")
    .select("debut_le, prix_credits, places_restantes, ateliers!inner(id, titre, savoir_faire, description, quartier, code_postal, ville, duree_minutes, photo_url, prix_public_eur, statut, artisans(nom_commercial))")
    .eq("statut", "ouverte")
    .gt("places_restantes", 0)
    .gt("debut_le", maintenant.toISOString())
    .lt("debut_le", new Date(maintenant.getTime() + JOURS_RECHERCHE * 86_400_000).toISOString())
    .eq("ateliers.statut", "publie")
    .order("debut_le")
    .limit(600);
  if (erreurSessions) {
    console.error(`[trouver-atelier] sessions illisibles : ${erreurSessions.message}`);
    return reponse(500, { code: "ERREUR", erreur: "Service indisponible" });
  }
  type Ligne = { debut_le: string; prix_credits: number; places_restantes: number; ateliers: Record<string, unknown> };
  const sessions: SessionDisponible[] = ((lignes ?? []) as unknown as Ligne[]).map((l) => ({
    atelier_id: String(l.ateliers.id),
    titre: String(l.ateliers.titre),
    artisan: (l.ateliers.artisans as { nom_commercial?: string } | null)?.nom_commercial ?? null,
    savoir_faire: LIBELLES_SAVOIR_FAIRE[String(l.ateliers.savoir_faire)] ?? String(l.ateliers.savoir_faire),
    description: String(l.ateliers.description ?? ""),
    quartier: (l.ateliers.quartier as string | null) ?? null,
    code_postal: String(l.ateliers.code_postal ?? ""),
    ville: String(l.ateliers.ville ?? ""),
    duree_minutes: Number(l.ateliers.duree_minutes),
    photo_url: (l.ateliers.photo_url as string | null) ?? null,
    prix_public: l.ateliers.prix_public_eur == null ? null : Number(l.ateliers.prix_public_eur),
    debut_le: l.debut_le,
    prix_credits: l.prix_credits,
    places_restantes: l.places_restantes,
  }));
  const ateliers = ateliersDisponibles(sessions, maintenant.getTime()).slice(0, 40);
  if (!ateliers.length) {
    return reponse(200, { suggestions: [], message: "Aucun atelier n'a de place disponible pour le moment.", restantes });
  }

  // 5. Gemini, réponse JSON imposée.
  const cle = Deno.env.get("GEMINI_API_KEY");
  if (!cle) {
    console.error("[trouver-atelier] secret GEMINI_API_KEY absent");
    return reponse(503, { code: "IA_INDISPONIBLE", erreur: "Assistant indisponible" });
  }
  const zone = zoneDepuisAdresse(profil.code_postal, profil.ville);
  // Délai de 20 s ; en cas d'échec (délai dépassé, surcharge, erreur réseau), un seul nouvel essai.
  const appelerGemini = async () => {
    const appel = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELE_GEMINI}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify(requeteGemini(phrase, zone, ateliers)),
      signal: AbortSignal.timeout(DELAI_GEMINI_MS),
    });
    if (!appel.ok) throw new ErreurGemini(appel.status, (await appel.text()).slice(0, 500));
    const json = (await appel.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    return (json.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  };
  let texte = "";
  for (let essai = 1; essai <= 2; essai++) {
    const debut = Date.now();
    try {
      texte = await appelerGemini();
      console.log(`[trouver-atelier] Gemini a répondu en ${Date.now() - debut} ms (essai ${essai})`);
      break;
    } catch (e) {
      const statut = e instanceof ErreurGemini ? e.statut : 0;
      console.error(`[trouver-atelier] essai ${essai} : ${e instanceof ErreurGemini ? `Gemini a répondu ${statut} : ${e.message}` : `Gemini injoignable : ${e instanceof Error ? e.message : String(e)}`}`);
      // Une requête refusée (clé, paramètre) ne réussira pas mieux au second essai.
      if (essai === 2 || (statut >= 400 && statut < 500 && statut !== 429)) {
        return reponse(503, { code: statut === 429 ? "IA_SATUREE" : "IA_INDISPONIBLE", erreur: "Assistant indisponible" });
      }
    }
  }

  // 6. Vérification côté serveur : seuls des ateliers de la liste envoyée, au plus 3.
  const { suggestions, message } = validerReponse(texte, ateliers);
  return reponse(200, {
    suggestions: suggestions.map(({ atelier, raison }) => ({
      atelier_id: atelier.id,
      titre: atelier.titre,
      artisan: atelier.artisan,
      savoir_faire: atelier.savoir_faire,
      lieu: atelier.lieu,
      duree_minutes: atelier.duree_minutes,
      prix_min_credits: atelier.prix_min_credits,
      prix_public: atelier.prix_public,
      prochaine_session: atelier.prochaine_session,
      photo_url: atelier.photo_url,
      raison,
    })),
    message: suggestions.length ? message : message || "Aucun atelier disponible ne correspond vraiment à votre demande.",
    restantes,
  });
});
