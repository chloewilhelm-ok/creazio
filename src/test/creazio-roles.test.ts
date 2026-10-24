import { beforeEach, describe, expect, it, vi } from "vitest";

// Faux client Supabase : une session et une ligne profiles / artisans configurables.
const db = vi.hoisted(() => ({
  session: null as null | { user: { id: string; user_metadata: Record<string, unknown> } },
  role: null as string | null,
  statut: null as string | null,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: db.session } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: table === "profiles" ? (db.role ? { role: db.role } : null) : db.statut ? { statut_candidature: db.statut } : null,
          }),
        }),
      }),
    }),
  },
}));

import { oublierProfilRole, requireSession } from "@/lib/auth";
import { metadonneesCandidature, premierChampCandidature, validerCandidatureArtisan } from "@/lib/inscription";
import {
  MESSAGE_COMPTE_EXISTANT,
  PAGE_CANDIDATURE,
  accueilDuCompte,
  compteDejaExistant,
  redirectionEspace,
  refusConnexion,
} from "@/lib/roles";

const eleve = { role: "eleve" as const, statutCandidature: null };
const artisanValide = { role: "artisan" as const, statutCandidature: "validee" };
const artisanEnAttente = { role: "artisan" as const, statutCandidature: "en_attente" };

describe("un email = un seul compte", () => {
  it("détecte le faux succès de Supabase (identités vides) quand l'email existe déjà", () => {
    expect(compteDejaExistant({ identities: [] })).toBe(true);
    expect(compteDejaExistant(null, { message: "User already registered" })).toBe(true);
  });
  it("laisse passer une vraie création de compte", () => {
    expect(compteDejaExistant({ identities: [{ id: "x" }] })).toBe(false);
    expect(compteDejaExistant(null, null)).toBe(false);
  });
  it("affiche le message demandé", () => {
    expect(MESSAGE_COMPTE_EXISTANT).toBe("Un compte existe déjà avec cet email. Connectez-vous.");
  });
});

describe("connexion depuis le bon espace", () => {
  it("refuse un compte élève sur la connexion artisan, avec un lien vers la connexion élève", () => {
    expect(refusConnexion("artisan", "eleve")).toMatchObject({ message: "Ce compte est un compte élève.", lien: "/connexion" });
  });
  it("refuse un compte artisan sur la connexion élève, avec un lien vers la connexion artisan", () => {
    expect(refusConnexion("eleve", "artisan")).toMatchObject({ message: "Ce compte est un compte artisan.", lien: "/artisan/connexion" });
  });
  it("accepte un compte dans son propre espace", () => {
    expect(refusConnexion("eleve", "eleve")).toBeNull();
    expect(refusConnexion("artisan", "artisan")).toBeNull();
  });
  it("envoie chaque compte vers son accueil ; candidature non validée vers la page d'attente", () => {
    expect(accueilDuCompte(eleve)).toBe("/espace-eleve");
    expect(accueilDuCompte(artisanValide)).toBe("/artisan/planning");
    expect(accueilDuCompte(artisanEnAttente)).toBe(PAGE_CANDIDATURE);
  });
});

describe("pages réservées à chaque rôle", () => {
  it("garde les pages élève pour les élèves", () => {
    expect(redirectionEspace("eleve", eleve)).toBeNull();
    expect(redirectionEspace("eleve", artisanValide)).toBe("/artisan/planning");
  });
  it("garde les pages artisan pour les artisans validés", () => {
    expect(redirectionEspace("artisan", artisanValide, "/artisan/revenus")).toBeNull();
    expect(redirectionEspace("artisan", eleve, "/artisan/revenus")).toBe("/espace-eleve");
  });
  it("limite un artisan en attente à la page « candidature en cours »", () => {
    expect(redirectionEspace("artisan", artisanEnAttente, "/artisan/planning")).toBe(PAGE_CANDIDATURE);
    expect(redirectionEspace("artisan", artisanEnAttente, PAGE_CANDIDATURE)).toBeNull();
    expect(redirectionEspace("artisan", artisanValide, PAGE_CANDIDATURE)).toBe("/artisan/planning");
  });
  it("renvoie vers la connexion quand le compte n'a pas de rôle", () => {
    expect(redirectionEspace("artisan", null)).toBe("/artisan/connexion");
  });
});

describe("requireSession vérifie le rôle", () => {
  const cible = async (area: "eleve" | "artisan", chemin = "") => {
    try {
      await requireSession(area, chemin);
      return null;
    } catch (e) {
      return (e as { options?: { to?: string } }).options?.to ?? "erreur";
    }
  };
  beforeEach(() => {
    oublierProfilRole();
    db.session = { user: { id: `u${Math.random()}`, user_metadata: {} } };
  });
  it("redirige un élève qui ouvre une page artisan vers son espace", async () => {
    db.role = "eleve"; db.statut = null;
    expect(await cible("artisan", "/artisan/planning")).toBe("/espace-eleve");
    expect(await cible("eleve")).toBeNull();
  });
  it("redirige un artisan en attente vers la page de candidature", async () => {
    db.role = "artisan"; db.statut = "en_attente";
    expect(await cible("artisan", "/artisan/planning")).toBe(PAGE_CANDIDATURE);
    expect(await cible("eleve")).toBe(PAGE_CANDIDATURE);
  });
  it("redirige vers la connexion sans session", async () => {
    db.session = null;
    expect(await cible("artisan")).toBe("/artisan/connexion");
    expect(await cible("eleve")).toBe("/connexion");
  });
});

describe("inscription artisan", () => {
  const complete = {
    prenom: "Michel", nom: "Durand", email: "michel@exemple.fr", password: "motdepasse",
    adresse: { street: "8 Rue de la Roquette", postcode: "75011", city: "Paris", access: "" },
    atelier: "Atelier Terres Vives", savoirFaire: ["Poterie et Céramique"], techniques: [], presentation: "Céramiste depuis 10 ans.",
    cguLe: "2026-10-24T12:00:00.000Z",
  };
  it("exige tous les champs, dans l'ordre du formulaire", () => {
    const erreurs = validerCandidatureArtisan({ ...complete, prenom: "", atelier: "", savoirFaire: [], presentation: " ", cguLe: null });
    expect(Object.keys(erreurs).sort()).toEqual(["atelier", "cgu", "prenom", "presentation", "savoirFaire"]);
    expect(premierChampCandidature(erreurs)).toBe("prenom");
    expect(validerCandidatureArtisan(complete)).toEqual({});
  });
  it("exige au moins un savoir-faire et l'acceptation des CGU", () => {
    expect(validerCandidatureArtisan({ ...complete, savoirFaire: [] }).savoirFaire).toBe("Choisissez au moins un savoir-faire.");
    expect(validerCandidatureArtisan({ ...complete, cguLe: null }).cgu).toMatch(/CGU/);
  });
  it("crée un compte au rôle artisan, avec l'heure réelle du clic sur les CGU", () => {
    expect(metadonneesCandidature(complete)).toMatchObject({
      role: "artisan", atelier: "Atelier Terres Vives", categories: ["Poterie et Céramique"],
      cgu_acceptees_le: complete.cguLe, confidentialite_acceptee_le: complete.cguLe,
    });
  });
});
