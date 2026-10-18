import { describe, expect, it } from "vitest";
import { availableSessions } from "@/lib/workshop-sessions";

const now = Date.parse("2026-10-18T06:00:00Z");
const slot = { id: "lundi", debut_le: "2026-10-19T17:00:00Z", statut: "ouverte" as const, places_restantes: 2 };
describe("créneaux disponibles pour les élèves", () => {
  it("affiche les créneaux ouverts avec des places", () => {
    expect(availableSessions([slot], now).map(s => s.id)).toEqual(["lundi"]);
  });
  it("masque les créneaux complets", () => {
    expect(availableSessions([{ ...slot, places_restantes: 0 }], now)).toEqual([]);
  });
  it("masque les créneaux annulés", () => {
    expect(availableSessions([{ ...slot, statut: "annulee" }], now)).toEqual([]);
  });
  it("masque les créneaux passés", () => {
    expect(availableSessions([{ ...slot, debut_le: "2026-10-17T17:00:00Z" }], now)).toEqual([]);
  });
  it("présente les prochaines dates en premier", () => {
    const mercredi = { ...slot, id: "mercredi", debut_le: "2026-10-21T17:00:00Z" };
    expect(availableSessions([mercredi, slot], now).map(s => s.id)).toEqual(["lundi", "mercredi"]);
  });
});