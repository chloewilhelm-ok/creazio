import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { savoirFaireByCategory, type CraftCategory } from "@/components/creazio/catalog";

export type ProfileRole = "eleve" | "artisan";

// Route guard: the session lives in the browser only, so the check runs on the
// client and redirects on hydration for direct visits.
export async function requireSession(area: ProfileRole | "any"): Promise<void> {
  if (typeof window === "undefined") return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: area === "artisan" ? "/artisan/connexion" : "/connexion" });
  }
}

export function friendlyAuthError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue. Réessayez.";
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (message.includes("already registered")) return "Un compte existe déjà avec cette adresse email.";
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
}

// Creates the public profile (and the artisan record for artisans) right after
// sign-up or first sign-in, when the database has no trigger for it.
export async function ensureProfile(userId: string, data: PendingProfile): Promise<void> {
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
    cgu_acceptees_le: now,
    confidentialite_acceptee_le: now,
  });
  if (error) throw error;
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
