import { describe, expect, it } from "vitest";
import {
  FILTRES_PAR_DEFAUT,
  arrondissementParis,
  correspondBudget,
  correspondCreneau,
  correspondLieu,
  nombreFiltresActifs,
  prixMinCorrespondant,
  villesDesCouronnes,
} from "@/lib/filtres-recherche";

const NOW = Date.parse("2026-10-25T08:00:00Z");
// Heures de Paris (heure d'hiver à partir du 25/10 : UTC+1).
const MARDI_14H = "2026-10-27T13:00:00Z";
const MARDI_19H = "2026-10-27T18:00:00Z";
const SAMEDI_10H = "2026-10-31T09:00:00Z";
const DIMANCHE_15H = "2026-11-01T14:00:00Z";
const session = (debut_le: string, prix_credits: number, extra: Partial<{ statut: string; places_restantes: number }> = {}) => ({
  debut_le, prix_credits, statut: "ouverte", places_restantes: 3, ...extra,
});

describe("lieu", () => {
  it("reconnaît les arrondissements de Paris, 16e compris", () => {
    expect(arrondissementParis("75018")).toBe(18);
    expect(arrondissementParis("75001")).toBe(1);
    expect(arrondissementParis("75116")).toBe(16);
    expect(arrondissementParis("92100")).toBeNull();
  });
  it("filtre par arrondissement ou par ville de couronne", () => {
    expect(correspondLieu("paris-18", { code_postal: "75018", ville: "Paris" })).toBe(true);
    expect(correspondLieu("paris-18", { code_postal: "75011", ville: "Paris" })).toBe(false);
    expect(correspondLieu("ville:92:Boulogne-Billancourt", { code_postal: "92100", ville: "boulogne-billancourt" })).toBe(true);
    expect(correspondLieu("ville:92:Boulogne-Billancourt", { code_postal: "93100", ville: "Montreuil" })).toBe(false);
    expect(correspondLieu("partout", { code_postal: null, ville: null })).toBe(true);
  });
  it("ne propose que les villes de couronne où un atelier existe, sans doublon", () => {
    const v = villesDesCouronnes([
      { code_postal: "93100", ville: "Montreuil" },
      { code_postal: "93100", ville: "Montreuil" },
      { code_postal: "78000", ville: "Versailles" },
      { code_postal: "75011", ville: "Paris" },
    ]);
    expect(v.petite).toEqual([{ value: "ville:93:Montreuil", label: "Montreuil (93)" }]);
    expect(v.grande).toEqual([{ value: "ville:78:Versailles", label: "Versailles (78)" }]);
  });
});

describe("budget et créneau", () => {
  it("découpe le budget en tranches", () => {
    expect(correspondBudget("moins-30", 29)).toBe(true);
    expect(correspondBudget("moins-30", 30)).toBe(false);
    expect(correspondBudget("30-39", 39)).toBe(true);
    expect(correspondBudget("40-49", 40)).toBe(true);
    expect(correspondBudget("50-plus", 50)).toBe(true);
  });
  it("lit le jour et l'heure à Paris", () => {
    expect(correspondCreneau("semaine-jour", MARDI_14H)).toBe(true);
    expect(correspondCreneau("semaine-soir", MARDI_19H)).toBe(true);
    expect(correspondCreneau("semaine-jour", MARDI_19H)).toBe(false);
    expect(correspondCreneau("samedi", SAMEDI_10H)).toBe(true);
    expect(correspondCreneau("dimanche", DIMANCHE_15H)).toBe(true);
    expect(correspondCreneau("dimanche", SAMEDI_10H)).toBe(false);
  });
});

describe("sessions qui correspondent", () => {
  const sessions = [session(MARDI_19H, 42), session(SAMEDI_10H, 36), session(DIMANCHE_15H, 28, { places_restantes: 0 }), session("2026-10-20T10:00:00Z", 20)];
  it("prend le prix le plus bas parmi les sessions futures, ouvertes, avec une place", () => {
    expect(prixMinCorrespondant(sessions, FILTRES_PAR_DEFAUT, NOW)).toBe(36);
  });
  it("exige qu'une MÊME session respecte budget et créneau", () => {
    expect(prixMinCorrespondant(sessions, { budget: "40-49", creneau: "semaine-soir" }, NOW)).toBe(42);
    expect(prixMinCorrespondant(sessions, { budget: "30-39", creneau: "semaine-soir" }, NOW)).toBeNull();
    expect(prixMinCorrespondant(sessions, { budget: "tous", creneau: "dimanche" }, NOW)).toBeNull();
  });
  it("ignore les sessions fermées et l'absence de sessions", () => {
    expect(prixMinCorrespondant([session(MARDI_14H, 30, { statut: "annulee" })], FILTRES_PAR_DEFAUT, NOW)).toBeNull();
    expect(prixMinCorrespondant(undefined, FILTRES_PAR_DEFAUT, NOW)).toBeNull();
  });
  it("compte les filtres actifs du panneau", () => {
    expect(nombreFiltresActifs(FILTRES_PAR_DEFAUT)).toBe(0);
    expect(nombreFiltresActifs({ lieu: "paris-18", budget: "moins-30", creneau: "tous" })).toBe(2);
  });
});
