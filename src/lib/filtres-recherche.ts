// Filtres de la page « Trouver un atelier » (PRD F3) : lieu, budget et créneau, combinables avec le
// savoir-faire et le mot-clé. Tout se calcule côté navigateur à partir des ateliers publiés et de leurs
// sessions déjà chargées (publishedWorkshopsQuery) ; la base n'est pas sollicitée.

export type FiltreBudget = "tous" | "moins-30" | "30-39" | "40-49" | "50-plus";
export type FiltreCreneau = "tous" | "semaine-jour" | "semaine-soir" | "samedi" | "dimanche";
/** « partout », « paris-18 » (arrondissement) ou « ville:92:Boulogne-Billancourt » (département et ville). */
export type FiltreLieu = string;

export interface Filtres {
  lieu: FiltreLieu;
  budget: FiltreBudget;
  creneau: FiltreCreneau;
}

export const FILTRES_PAR_DEFAUT: Filtres = { lieu: "partout", budget: "tous", creneau: "tous" };

export const OPTIONS_BUDGET: { value: FiltreBudget; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "moins-30", label: "Moins de 30 crédits" },
  { value: "30-39", label: "30 à 39 crédits" },
  { value: "40-49", label: "40 à 49 crédits" },
  { value: "50-plus", label: "50 crédits et plus" },
];

export const OPTIONS_CRENEAU: { value: FiltreCreneau; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "semaine-jour", label: "En semaine en journée" },
  { value: "semaine-soir", label: "En semaine le soir (après 18 h)" },
  { value: "samedi", label: "Samedi" },
  { value: "dimanche", label: "Dimanche" },
];

export const PETITE_COURONNE = ["92", "93", "94"];
export const GRANDE_COURONNE = ["77", "78", "91", "95"];

/** Nombre de filtres du panneau différents de leur valeur par défaut (affiché sur le bouton « Filtrer »). */
export function nombreFiltresActifs(f: Filtres): number {
  return (f.lieu !== "partout" ? 1 : 0) + (f.budget !== "tous" ? 1 : 0) + (f.creneau !== "tous" ? 1 : 0);
}

/** Arrondissement parisien d'un code postal (75001 → 1, 75116 → 16), sinon null. */
export function arrondissementParis(codePostal: string | null | undefined): number | null {
  const cp = (codePostal ?? "").trim();
  if (cp === "75116") return 16;
  const m = /^750(\d{2})$/.exec(cp);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 20 ? n : null;
}

export const libelleArrondissement = (n: number) => `Paris ${n}${n === 1 ? "er" : "e"}`;

const departement = (cp: string | null | undefined) => (cp ?? "").trim().slice(0, 2);
const normaliser = (t: string) => t.trim().toLowerCase();

export interface VilleCouronne {
  value: FiltreLieu;
  label: string;
}

/**
 * Villes de petite et grande couronne où au moins un atelier publié existe, triées par nom.
 * Une même ville n'apparaît qu'une fois par département.
 */
export function villesDesCouronnes(ateliers: { code_postal: string | null; ville: string | null }[]): {
  petite: VilleCouronne[];
  grande: VilleCouronne[];
} {
  const vues = new Map<string, VilleCouronne & { dep: string }>();
  for (const a of ateliers) {
    const dep = departement(a.code_postal);
    const ville = (a.ville ?? "").trim();
    if (!ville || (!PETITE_COURONNE.includes(dep) && !GRANDE_COURONNE.includes(dep))) continue;
    const cle = `${dep}:${normaliser(ville)}`;
    if (!vues.has(cle)) vues.set(cle, { value: `ville:${dep}:${ville}`, label: `${ville} (${dep})`, dep });
  }
  const tri = (l: VilleCouronne[]) => l.sort((x, y) => x.label.localeCompare(y.label, "fr"));
  const liste = [...vues.values()];
  return {
    petite: tri(liste.filter((v) => PETITE_COURONNE.includes(v.dep)).map(({ value, label }) => ({ value, label }))),
    grande: tri(liste.filter((v) => GRANDE_COURONNE.includes(v.dep)).map(({ value, label }) => ({ value, label }))),
  };
}

/** L'atelier est-il dans le lieu choisi ? */
export function correspondLieu(lieu: FiltreLieu, atelier: { code_postal: string | null; ville: string | null }): boolean {
  if (lieu === "partout") return true;
  if (lieu.startsWith("paris-")) return arrondissementParis(atelier.code_postal) === Number(lieu.slice(6));
  if (lieu.startsWith("ville:")) {
    const [, dep, ...reste] = lieu.split(":");
    return departement(atelier.code_postal) === dep && normaliser(atelier.ville ?? "") === normaliser(reste.join(":"));
  }
  return true;
}

export function correspondBudget(budget: FiltreBudget, credits: number): boolean {
  switch (budget) {
    case "moins-30": return credits < 30;
    case "30-39": return credits >= 30 && credits <= 39;
    case "40-49": return credits >= 40 && credits <= 49;
    case "50-plus": return credits >= 50;
    default: return true;
  }
}

const jourEtHeureParis = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});

/** Jour (lun… dim) et heure de début à Paris, quel que soit le fuseau du navigateur. */
export function jourHeureParis(iso: string): { jour: string; heure: number } {
  const parts = jourEtHeureParis.formatToParts(new Date(iso));
  return {
    jour: parts.find((p) => p.type === "weekday")?.value ?? "",
    heure: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
  };
}

export function correspondCreneau(creneau: FiltreCreneau, debutLe: string): boolean {
  if (creneau === "tous") return true;
  const { jour, heure } = jourHeureParis(debutLe);
  const semaine = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(jour);
  switch (creneau) {
    case "semaine-jour": return semaine && heure < 18;
    case "semaine-soir": return semaine && heure >= 18;
    case "samedi": return jour === "Sat";
    case "dimanche": return jour === "Sun";
  }
}

export interface SessionChargee {
  debut_le: string;
  statut: string;
  places_restantes: number;
  prix_credits: number;
}

/**
 * Prix le plus bas parmi les sessions réservables (futures, ouvertes, avec une place) qui respectent le
 * budget et le créneau choisis ; null si aucune ne convient : l'atelier est alors masqué.
 */
export function prixMinCorrespondant(
  sessions: SessionChargee[] | null | undefined,
  filtres: Pick<Filtres, "budget" | "creneau">,
  maintenant = Date.now(),
): number | null {
  let min: number | null = null;
  for (const s of sessions ?? []) {
    if (s.statut !== "ouverte" || s.places_restantes <= 0 || Date.parse(s.debut_le) <= maintenant) continue;
    if (!correspondBudget(filtres.budget, s.prix_credits) || !correspondCreneau(filtres.creneau, s.debut_le)) continue;
    if (min == null || s.prix_credits < min) min = s.prix_credits;
  }
  return min;
}
