import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { savoirFaireByCategory, type CraftCategory } from "@/components/creazio/catalog";
import { MESSAGE_COMPTE_EXISTANT, redirectionEspace, type ProfilRole } from "./roles";

export type ProfileRole = "eleve" | "artisan";
export type { ProfilRole } from "./roles";

// Rôle du compte connecté (profil) et statut de sa candidature artisan, lus sous RLS.
// Mis en cache par utilisateur le temps de la visite : une validation de candidature se voit au rechargement.
const profilsEnCache = new Map<string, ProfilRole>();
export async function lireProfilRole(userId: string, meta?: { role?: unknown }): Promise<ProfilRole | null> {
  const enCache = profilsEnCache.get(userId);
  if (enCache) return enCache;
  const [{ data: profil }, { data: artisan }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("artisans").select("statut_candidature").eq("profile_id", userId).maybeSingle(),
  ]);
  // Sans profil (ancien compte créé avant le trigger), le rôle choisi à l'inscription fait foi.
  const role = profil?.role ?? (meta?.role === "artisan" || meta?.role === "eleve" ? meta.role : null);
  if (role !== "eleve" && role !== "artisan") return null;
  const resultat: ProfilRole = { role, statutCandidature: artisan?.statut_candidature ?? null };
  if (profil) profilsEnCache.set(userId, resultat);
  return resultat;
}
export const oublierProfilRole = () => profilsEnCache.clear();
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" || event === "SIGNED_IN") oublierProfilRole();
  });
}

// Route guard: the session lives in the browser only, so the check runs on the
// client and redirects on hydration for direct visits. Protected areas also check
// the account's role: student pages for students, artisan pages for validated artisans.
export async function requireSession(area: ProfileRole | "any", chemin = ""): Promise<void> {
  if (typeof window === "undefined") return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: area === "artisan" ? "/artisan/connexion" : "/connexion" });
  }
  if (area === "any") return;
  const profil = await lireProfilRole(data.session.user.id, data.session.user.user_metadata);
  const cible = redirectionEspace(area, profil, chemin);
  if (cible) throw redirect({ to: cible });
}

export function friendlyAuthError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue. Réessayez.";
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (message.includes("already registered")) return MESSAGE_COMPTE_EXISTANT;
  if (message.includes("should be different")) return "Choisissez un mot de passe différent de l’ancien.";
  if (message.includes("session missing") || message.includes("Auth session")) return "Ce lien n’est plus valable. Demandez un nouveau lien de réinitialisation.";
  if (message.toLowerCase().includes("password")) return "Mot de passe trop court : 8 caractères minimum.";
  if (message.includes("rate limit") || message.includes("Too many")) return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  if (message.includes("row-level security")) return "Votre base Supabase n’a pas encore les règles d’accès (RLS) nécessaires pour cette action.";
  return message;
}

export interface PendingProfile {
  role: ProfileRole;
  prenom: string;
  nom: string;
  email: string;
  adresse_ligne?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  atelier?: string | undefined;
  categories?: string[] | undefined;
  /** Heures des clics sur les cases de consentement (ISO), transmises à l'inscription. */
  cgu_acceptees_le?: string | null;
  confidentialite_acceptee_le?: string | null;
  newsletter_acceptee_le?: string | null;
}

const texte = (v: unknown) => (typeof v === "string" ? v : null);

/** Données d'inscription conservées dans user_metadata, relues à la première connexion après confirmation de l'email. */
type MetadonneesInscription = Partial<Record<keyof PendingProfile, unknown>>;

export function pendingProfileFromMetadata(meta: MetadonneesInscription, email: string): PendingProfile | null {
  if (meta.role !== "eleve" && meta.role !== "artisan") return null;
  return {
    role: meta.role,
    prenom: texte(meta.prenom) ?? "",
    nom: texte(meta.nom) ?? "",
    email,
    adresse_ligne: texte(meta.adresse_ligne),
    code_postal: texte(meta.code_postal),
    ville: texte(meta.ville),
    atelier: texte(meta.atelier) ?? undefined,
    categories: Array.isArray(meta.categories) ? meta.categories.filter((c): c is string => typeof c === "string") : undefined,
    cgu_acceptees_le: texte(meta.cgu_acceptees_le),
    confidentialite_acceptee_le: texte(meta.confidentialite_acceptee_le),
    newsletter_acceptee_le: texte(meta.newsletter_acceptee_le),
  };
}

// Creates the public profile (and the artisan record for artisans) right after
// sign-up or first sign-in, when the database trigger has not created it.
export async function ensureProfile(userId: string, data: PendingProfile): Promise<void> {
  const { data: existing, error: readError } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (readError) throw readError;
  if (existing) {
    // Row created by the auth.users trigger, with the consent dates: only the editable fields are completed.
    const { error } = await supabase.from("profiles").update({
      prenom: data.prenom,
      nom: data.nom,
      adresse_ligne: data.adresse_ligne ?? null,
      code_postal: data.code_postal ?? null,
      ville: data.ville ?? null,
    }).eq("id", userId);
    if (error) throw error;
  } else {
    const now = new Date().toISOString();
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      role: data.role,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      adresse_ligne: data.adresse_ligne ?? null,
      code_postal: data.code_postal ?? null,
      ville: data.ville ?? null,
      cgu_acceptees_le: data.cgu_acceptees_le ?? now,
      confidentialite_acceptee_le: data.confidentialite_acceptee_le ?? now,
      newsletter_acceptee_le: data.newsletter_acceptee_le ?? null,
    });
    if (error) throw error;
  }
  if (data.role === "artisan") {
    const principal = data.categories && data.categories.length > 0
      ? savoirFaireByCategory[data.categories[0] as CraftCategory]
      : "poterie_ceramique";
    await supabase.from("artisans").insert({
      profile_id: userId,
      nom_commercial: data.atelier ?? "",
      adresse_ligne: data.adresse_ligne ?? "",
      code_postal: data.code_postal ?? "",
      ville: data.ville ?? "",
      savoir_faire_principal: principal,
    });
    if (data.categories && data.categories.length > 0) {
      await supabase.from("profil_savoirs_faire").insert(
        data.categories.map(category => ({ profile_id: userId, savoir_faire: savoirFaireByCategory[category as CraftCategory] })),
      );
    }
  }
}
