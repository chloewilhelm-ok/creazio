import type { Address } from "@/components/creazio/catalog";

export interface SuggestionAdresse {
  id: string;
  libelle: string;
  rue: string;
  codePostal: string;
  ville: string;
}

/** Suggestions d'adresses françaises (api-adresse.data.gouv.fr) ; liste vide si la recherche échoue. */
export async function rechercherAdresses(
  texte: string,
  signal?: AbortSignal,
): Promise<SuggestionAdresse[]> {
  const q = texte.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&autocomplete=1&limit=5`,
      signal ? { signal } : undefined,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      features?: {
        properties: { id: string; label: string; name: string; postcode?: string; city?: string };
      }[];
    };
    return (json.features ?? [])
      .filter((f) => f.properties.postcode && f.properties.city)
      .map((f) => ({
        id: f.properties.id,
        libelle: f.properties.label,
        rue: f.properties.name,
        codePostal: f.properties.postcode ?? "",
        ville: f.properties.city ?? "",
      }));
  } catch {
    return [];
  }
}

/** Libellé affiché pour une adresse déjà choisie. */
export const libelleAdresse = (a: Address) =>
  a.street && a.postcode && a.city ? `${a.street} ${a.postcode} ${a.city}` : "";

/** Une adresse est retenue quand la rue, le code postal et la ville viennent d'une suggestion. */
export const adresseChoisie = (a: Address) => Boolean(a.street && a.postcode && a.city);
