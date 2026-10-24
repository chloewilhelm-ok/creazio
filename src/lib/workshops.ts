import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { craftCategories, savoirFaireByCategory, type CraftCategory, type SavoirFaire } from "@/components/creazio/catalog";

export const RAYON_RECOMMANDATION_KM = 5;

export function labelSavoirFaire(value: string): string {
  return craftCategories.find(c => savoirFaireByCategory[c] === value) ?? value;
}
export function categoriesToSavoirFaire(categories: string[]): SavoirFaire[] {
  return [...new Set(categories.map(c => savoirFaireByCategory[c as CraftCategory]).filter(Boolean))];
}

/** Distance à vol d'oiseau (Haversine), en km. */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const formatKm = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** Distance lisible : « 850 m » sous 1 km (arrondi à la dizaine), sinon « 7,1 km » (1 décimale, virgule). */
export function formatDistance(km: number): string {
  const metres = Math.round((km * 1000) / 10) * 10;
  if (metres < 1000) return `${metres} m`;
  return `${formatKm.format(km)} km`;
}

/** Géocode une adresse française via api-adresse.data.gouv.fr ; null si introuvable. */
export async function geocodeAddress(street?: string | null, postcode?: string | null, city?: string | null): Promise<{ latitude: number; longitude: number } | null> {
  const q = [street, postcode, city].filter(Boolean).join(" ").trim();
  if (q.length < 3) return null;
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`);
    if (!res.ok) return null;
    const json = await res.json() as { features?: { geometry: { coordinates: [number, number] } }[] };
    const c = json.features?.[0]?.geometry.coordinates;
    return c ? { longitude: c[0], latitude: c[1] } : null;
  } catch { return null; }
}

/** Remplace les centres d'intérêt de l'utilisateur dans profil_savoirs_faire. */
export async function saveInterests(userId: string, categories: string[]) {
  const values = categoriesToSavoirFaire(categories);
  await supabase.from("profil_savoirs_faire").delete().eq("profile_id", userId);
  if (values.length) await supabase.from("profil_savoirs_faire").insert(values.map(savoir_faire => ({ profile_id: userId, savoir_faire })));
}

/**
 * Enregistre les ateliers favoris choisis à l'inscription (user_metadata.categories) si l'élève n'a encore
 * aucun centre d'intérêt. Nécessaire quand la connexion vient du lien de confirmation de l'email :
 * le formulaire de connexion n'est alors jamais passé, et le trigger de la base ne gère que les artisans.
 */
export async function ensureSignupInterests(user: { id: string; user_metadata?: { role?: unknown; categories?: unknown } }) {
  const meta = user.user_metadata ?? {};
  const categories = Array.isArray(meta.categories) ? meta.categories.filter((c): c is string => typeof c === "string") : [];
  if (meta.role === "artisan" || !categories.length) return;
  const { count } = await supabase.from("profil_savoirs_faire").select("savoir_faire", { count: "exact", head: true }).eq("profile_id", user.id);
  if (!count) await saveInterests(user.id, categories);
}

/** Complète les coordonnées du profil si elles manquent. */
export async function ensureProfileCoords(userId: string) {
  const { data } = await supabase.from("profiles").select("adresse_ligne,code_postal,ville,latitude").eq("id", userId).maybeSingle();
  if (!data || data.latitude != null) return;
  const geo = await geocodeAddress(data.adresse_ligne, data.code_postal, data.ville);
  if (geo) await supabase.from("profiles").update(geo).eq("id", userId);
}

export const publishedWorkshopsQuery = queryOptions({
  queryKey: ["ateliers", "publies"],
  queryFn: async () => {
    const { data, error } = await supabase.from("ateliers")
      .select("id,titre,description,savoir_faire,ville,quartier,code_postal,duree_minutes,photo_url,cree_le,latitude,longitude,sessions(prix_credits)")
      .eq("statut", "publie").order("cree_le", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const workshopQuery = (id: string) => queryOptions({
  queryKey: ["ateliers", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("ateliers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const recommendationsQuery = queryOptions({
  queryKey: ["ateliers", "recommandes"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: "anon" as const, items: [] };
    await Promise.all([ensureProfileCoords(user.id), ensureSignupInterests(user)]);
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("latitude").eq("id", user.id).maybeSingle(),
      supabase.from("profil_savoirs_faire").select("savoir_faire", { count: "exact", head: true }).eq("profile_id", user.id),
    ]);
    if (profile?.latitude == null || !count) return { status: "incomplet" as const, items: [] };
    const { data, error } = await supabase.rpc("ateliers_recommandes", { rayon_km: RAYON_RECOMMANDATION_KM });
    if (error) throw error;
    return { status: "ok" as const, items: data ?? [] };
  },
});

export function formatDuree(min: number) { const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`; }
