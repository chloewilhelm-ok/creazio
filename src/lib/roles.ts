// Séparation des espaces élève et artisan : un email = un compte = un rôle.
// Fonctions pures, testées dans src/test/creazio-roles.test.ts ; utilisées par les gardes de routes
// (requireSession), la connexion et les deux inscriptions.

export type Espace = "eleve" | "artisan";

export interface ProfilRole {
  role: Espace;
  /** Statut de la candidature artisan ('en_attente', 'validee', 'refusee'…), null pour un élève. */
  statutCandidature: string | null;
}

export const MESSAGE_COMPTE_EXISTANT = "Un compte existe déjà avec cet email. Connectez-vous.";
export const PAGE_CANDIDATURE = "/artisan/candidature-envoyee";

export const pageConnexion = (espace: Espace) => (espace === "artisan" ? "/artisan/connexion" : "/connexion");

/**
 * Supabase ne renvoie pas d'erreur quand on s'inscrit avec un email déjà utilisé (pour ne pas révéler
 * quels emails ont un compte) : il répond par un faux utilisateur dont la liste d'identités est vide,
 * et n'envoie aucun email. On reconnaît ce cas, ainsi que l'erreur explicite « already registered ».
 */
export function compteDejaExistant(
  user: { identities?: unknown[] | null } | null | undefined,
  erreur?: { message?: string } | null,
): boolean {
  if (erreur?.message?.includes("already registered")) return true;
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

/** Connexion depuis le mauvais espace : message et lien vers la bonne page, sinon null. */
export function refusConnexion(espace: Espace, role: string | null | undefined) {
  if (role !== "eleve" && role !== "artisan") return null;
  if (role === espace) return null;
  return role === "eleve"
    ? { message: "Ce compte est un compte élève.", lien: "/connexion" as const, libelleLien: "Aller à la connexion élève" }
    : { message: "Ce compte est un compte artisan.", lien: "/artisan/connexion" as const, libelleLien: "Aller à la connexion artisan" };
}

/** Page d'accueil d'un compte après connexion. */
export function accueilDuCompte(profil: ProfilRole): "/espace-eleve" | "/artisan/planning" | typeof PAGE_CANDIDATURE {
  if (profil.role === "eleve") return "/espace-eleve";
  return profil.statutCandidature === "validee" ? "/artisan/planning" : PAGE_CANDIDATURE;
}

/**
 * Garde des espaces protégés : renvoie la page où rediriger, ou null si l'accès est permis.
 * Pages élève réservées aux élèves, pages artisan aux artisans validés ; un artisan dont la
 * candidature n'est pas validée ne voit que la page « candidature en cours ».
 */
export function redirectionEspace(espace: Espace, profil: ProfilRole | null, chemin = ""): string | null {
  if (!profil) return pageConnexion(espace);
  if (espace === "eleve") return profil.role === "eleve" ? null : accueilDuCompte(profil);
  if (profil.role !== "artisan") return "/espace-eleve";
  if (profil.statutCandidature !== "validee") return chemin === PAGE_CANDIDATURE ? null : PAGE_CANDIDATURE;
  return chemin === PAGE_CANDIDATURE ? "/artisan/planning" : null;
}
