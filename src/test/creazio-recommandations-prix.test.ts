import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { ajouterPrix } from "@/lib/workshops";

const NOW = Date.parse("2026-10-26T10:00:00Z");
const session = (debut_le: string, prix_credits: number, places_restantes = 3, statut = "ouverte") => ({ debut_le, prix_credits, places_restantes, statut });

describe("prix des ateliers recommandés", () => {
  const recommandes = [{ id: "a1", titre: "Atelier de poterie" }, { id: "a2", titre: "Modelez votre bol en grès" }, { id: "a3", titre: "Sans prix" }];
  const prix = [
    {
      id: "a2",
      prix_public_eur: "45.00",
      sessions: [
        session("2026-10-20T17:00:00Z", 20), // passée : ignorée
        session("2026-10-28T17:00:00Z", 25, 0), // complète : ignorée
        session("2026-10-29T17:00:00Z", 30, 2, "annulee"), // pas ouverte : ignorée
        session("2026-10-30T17:00:00Z", 36),
        session("2026-11-02T17:00:00Z", 32), // la moins chère réservable
      ],
    },
    { id: "a1", prix_public_eur: 40, sessions: [session("2026-10-27T08:00:00Z", 20)] },
  ];
  const resultat = ajouterPrix(recommandes, prix, NOW);

  it("retient le créneau le moins cher parmi les sessions futures, ouvertes et avec une place", () => {
    expect(resultat[1]).toMatchObject({ prix_min: 32, prix_public_eur: "45.00" });
    expect(resultat[0]).toMatchObject({ prix_min: 20, prix_public_eur: 40 });
  });
  it("garde l'ordre et la liste de la RPC, et un atelier sans prix connu reste sans badge", () => {
    expect(resultat.map((w) => w.id)).toEqual(["a1", "a2", "a3"]);
    expect(resultat[2]).toMatchObject({ prix_min: undefined, prix_public_eur: null });
  });
  it("si la requête de prix échoue, toutes les cartes restent, sans badge", () => {
    const sansPrix = ajouterPrix(recommandes, [], NOW);
    expect(sansPrix).toHaveLength(3);
    expect(sansPrix.every((w) => w.prix_min === undefined)).toBe(true);
  });
});
