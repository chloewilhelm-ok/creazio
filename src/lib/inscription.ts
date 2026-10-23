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
