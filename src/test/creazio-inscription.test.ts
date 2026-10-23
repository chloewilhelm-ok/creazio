import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { emptyAddress } from "@/components/creazio/catalog";
import { pendingProfileFromMetadata } from "@/lib/auth";
import {
  metadonneesInscription,
  premierChampEnErreur,
  validerCompte,
  validerInspirations,
} from "@/lib/inscription";

const adresse = { ...emptyAddress, street: "12 Rue Oberkampf", postcode: "75011", city: "Paris" };
const compte = { prenom: "Léa", nom: "Martin", email: "lea@exemple.fr", password: "motdepasse", adresse };

describe("inscription élève, étape 1", () => {
  it("accepte un compte complet", () => {
    expect(validerCompte(compte)).toEqual({});
  });
  it("signale chaque champ vide et donne le focus au premier dans l'ordre du formulaire", () => {
    const erreurs = validerCompte({ prenom: " ", nom: "", email: "", password: "", adresse: emptyAddress });
    expect(Object.keys(erreurs)).toEqual(["prenom", "nom", "email", "password", "adresse"]);
    expect(premierChampEnErreur(erreurs)).toBe("prenom");
    expect(premierChampEnErreur(validerCompte({ ...compte, password: "court" }))).toBe("password");
  });
  it("refuse un email mal formé et un mot de passe de moins de 8 caractères", () => {
    const erreurs = validerCompte({ ...compte, email: "lea@exemple", password: "1234567" });
    expect(erreurs.email).toMatch(/pas valide/);
    expect(erreurs.password).toMatch(/au moins 8 caractères/);
  });
  it("exige une adresse choisie dans les suggestions", () => {
    expect(validerCompte({ ...compte, adresse: emptyAddress }).adresse).toBe("Indiquez votre adresse.");
    expect(validerCompte({ ...compte, adresse: emptyAddress, adresseSaisie: true }).adresse).toBe(
      "Choisissez votre adresse dans la liste de suggestions.",
    );
  });
});

describe("inscription élève, étape 2", () => {
  const cguLe = "2026-10-23T18:04:05.000Z";
  it("exige au moins un savoir-faire et l'acceptation des CGU", () => {
    const erreurs = validerInspirations({ inspirations: [], consentements: { cguLe: null, newsletterLe: null } });
    expect(erreurs.inspirations).toBeDefined();
    expect(erreurs.cgu).toBeDefined();
    expect(validerInspirations({ inspirations: ["Bois"], consentements: { cguLe, newsletterLe: null } })).toEqual({});
  });
  it("transmet le nom et l'heure réelle des clics de consentement ; newsletter vide si non cochée", () => {
    const meta = metadonneesInscription(compte, { inspirations: ["Bois"], consentements: { cguLe, newsletterLe: null } });
    expect(meta).toMatchObject({
      role: "eleve",
      prenom: "Léa",
      nom: "Martin",
      code_postal: "75011",
      categories: ["Bois"],
      cgu_acceptees_le: cguLe,
      confidentialite_acceptee_le: cguLe,
      newsletter_acceptee_le: null,
    });
  });
  it("relit ces données en attente de confirmation de l'email", () => {
    const meta = metadonneesInscription(compte, {
      inspirations: ["Bois"],
      consentements: { cguLe, newsletterLe: "2026-10-23T18:04:09.000Z" },
    });
    expect(pendingProfileFromMetadata(meta, "lea@exemple.fr")).toMatchObject({
      role: "eleve",
      nom: "Martin",
      email: "lea@exemple.fr",
      cgu_acceptees_le: cguLe,
      newsletter_acceptee_le: "2026-10-23T18:04:09.000Z",
    });
    expect(pendingProfileFromMetadata({}, "x@y.fr")).toBeNull();
  });
});
