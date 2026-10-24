import type { Address } from "@/components/creazio/catalog";
import { adresseChoisie } from "./adresse";

export interface CompteEleve {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  adresse: Address;
  /** Texte tapé dans le champ d'adresse, pour distinguer « vide » de « pas choisie dans la liste ». */
  adresseSaisie?: boolean;
}

/** Champs de l'étape 1, dans l'ordre d'affichage (le premier en erreur reçoit le focus). */
export const CHAMPS_COMPTE = ["prenom", "nom", "email", "password", "adresse"] as const;
export type ChampCompte = (typeof CHAMPS_COMPTE)[number];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validerCompte(c: CompteEleve): Partial<Record<ChampCompte, string>> {
  const erreurs: Partial<Record<ChampCompte, string>> = {};
  if (!c.prenom.trim()) erreurs.prenom = "Indiquez votre prénom.";
  if (!c.nom.trim()) erreurs.nom = "Indiquez votre nom.";
  if (!c.email.trim()) erreurs.email = "Indiquez votre adresse email.";
  else if (!EMAIL.test(c.email.trim()))
    erreurs.email = "Cette adresse email n’est pas valide. Exemple : camille@exemple.fr";
  if (!c.password) erreurs.password = "Choisissez un mot de passe.";
  else if (c.password.length < 8)
    erreurs.password = "Le mot de passe doit contenir au moins 8 caractères.";
  if (!adresseChoisie(c.adresse))
    erreurs.adresse = c.adresseSaisie
      ? "Choisissez votre adresse dans la liste de suggestions."
      : "Indiquez votre adresse.";
  return erreurs;
}

export const premierChampEnErreur = (erreurs: Partial<Record<ChampCompte, string>>) =>
  CHAMPS_COMPTE.find((champ) => erreurs[champ]);

export interface Consentements {
  /** Heure du clic sur la case CGU et confidentialité (ISO), null si décochée. */
  cguLe: string | null;
  /** Heure du clic sur la case newsletter (ISO), null si décochée. */
  newsletterLe: string | null;
}

export interface ChoixInspirations {
  inspirations: string[];
  consentements: Consentements;
}

export type ErreursInspirations = { inspirations?: string | undefined; cgu?: string | undefined };

export function validerInspirations(c: ChoixInspirations): ErreursInspirations {
  const erreurs: ErreursInspirations = {};
  if (c.inspirations.length === 0) erreurs.inspirations = "Choisissez au moins un savoir-faire.";
  if (!c.consentements.cguLe)
    erreurs.cgu =
      "Acceptez les CGU et la politique de confidentialité pour créer votre compte.";
  return erreurs;
}

/**
 * Données transmises à Supabase à l'inscription (user_metadata). Elles servent au trigger qui crée
 * le profil, et restent disponibles si l'email doit d'abord être confirmé.
 */
export function metadonneesInscription(compte: CompteEleve, choix: ChoixInspirations) {
  return {
    role: "eleve" as const,
    prenom: compte.prenom.trim(),
    nom: compte.nom.trim(),
    adresse_ligne: compte.adresse.street,
    code_postal: compte.adresse.postcode,
    ville: compte.adresse.city,
    categories: choix.inspirations,
    cgu_acceptees_le: choix.consentements.cguLe,
    confidentialite_acceptee_le: choix.consentements.cguLe,
    newsletter_acceptee_le: choix.consentements.newsletterLe,
  };
}

// ── Inscription artisan ────────────────────────────────────────────────────
export interface CandidatureArtisan extends CompteEleve {
  atelier: string;
  savoirFaire: string[];
  techniques: string[];
  presentation: string;
  /** Heure du clic sur la case CGU et confidentialité (ISO), null si décochée. */
  cguLe: string | null;
}

/** Champs du formulaire artisan, dans l'ordre d'affichage (le premier en erreur reçoit le focus). */
export const CHAMPS_CANDIDATURE = [
  "prenom", "nom", "atelier", "email", "password", "adresse", "savoirFaire", "presentation", "cgu",
] as const;
export type ChampCandidature = (typeof CHAMPS_CANDIDATURE)[number];
export type ErreursCandidature = Partial<Record<ChampCandidature, string>>;

export function validerCandidatureArtisan(c: CandidatureArtisan): ErreursCandidature {
  const erreurs: ErreursCandidature = { ...validerCompte(c) };
  if (erreurs.adresse === "Indiquez votre adresse.") erreurs.adresse = "Indiquez l’adresse de votre atelier.";
  if (!c.atelier.trim()) erreurs.atelier = "Indiquez le nom de votre atelier.";
  if (c.savoirFaire.length === 0) erreurs.savoirFaire = "Choisissez au moins un savoir-faire.";
  if (!c.presentation.trim()) erreurs.presentation = "Présentez votre spécialité et votre expérience.";
  if (!c.cguLe) erreurs.cgu = "Acceptez les CGU et la politique de confidentialité pour envoyer votre candidature.";
  return erreurs;
}

export const premierChampCandidature = (erreurs: ErreursCandidature) =>
  CHAMPS_CANDIDATURE.find((champ) => erreurs[champ]);

/** user_metadata de l'inscription artisan : le trigger crée le profil artisan et la candidature « en attente ». */
export function metadonneesCandidature(c: CandidatureArtisan) {
  return {
    role: "artisan" as const,
    prenom: c.prenom.trim(),
    nom: c.nom.trim(),
    atelier: c.atelier.trim(),
    adresse_ligne: c.adresse.street,
    code_postal: c.adresse.postcode,
    ville: c.adresse.city,
    categories: c.savoirFaire,
    techniques: c.techniques,
    presentation: c.presentation.trim(),
    cgu_acceptees_le: c.cguLe,
    confidentialite_acceptee_le: c.cguLe,
  };
}
