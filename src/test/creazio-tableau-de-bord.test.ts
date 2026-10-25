import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import {
  indicateurs,
  libelleMois,
  lundiDe,
  moisSuivant,
  prochainVersement,
  reservationsPassees,
  versementsParMois,
  messageTableauDeBord,
  remplissageParCreneau,
  reservationsParSemaine,
  resumeCreneaux,
  resumeSemaines,
  type ReservationArtisan,
  type SessionArtisan,
} from "@/lib/tableau-de-bord";

// Samedi 24 octobre 2026, 12 h à Paris.
const NOW = Date.parse("2026-10-24T10:00:00Z");
let n = 0;
const resa = (debut_le: string, extra: Partial<ReservationArtisan> = {}): ReservationArtisan => ({
  reservation_id: `r${++n}`, session_id: "s", debut_le, atelier_titre: "Atelier de poterie", prenom: "Léa",
  code_creazio: `CRZ-${n}`, credits_debites: 32, montant_artisan_eur: 27.2, statut: "confirmee", versee: false,
  reservee_le: debut_le, ...extra,
});
const session = (debut_le: string, places_reservees: number, places_ouvertes_creazio = 4): SessionArtisan => ({
  session_id: debut_le, atelier_titre: "Atelier de poterie", debut_le, places_ouvertes_creazio, places_reservees,
});

describe("semaines à l'heure de Paris", () => {
  it("rattache chaque instant au lundi de sa semaine parisienne, y compris au passage à l'heure d'hiver", () => {
    expect(lundiDe(NOW)).toBe("2026-10-19");
    expect(lundiDe("2026-10-25T22:30:00Z")).toBe("2026-10-19"); // dimanche 23 h 30 à Paris
    expect(lundiDe("2026-10-25T23:30:00Z")).toBe("2026-10-26"); // lundi 0 h 30 à Paris
  });
});

describe("indicateurs clés", () => {
  const reservations = [
    resa("2026-10-10T17:00:00Z"),
    resa("2026-10-10T17:00:00Z", { versee: true }),
    resa("2026-10-28T18:00:00Z"),
    resa("2026-10-31T18:00:00Z", { statut: "annulee_cliente" }),
  ];
  const sessions = [session("2026-10-17T17:00:00Z", 4), session("2026-10-26T18:00:00Z", 1), session("2026-11-02T18:00:00Z", 2), session("2026-12-20T18:00:00Z", 0)];
  const k = indicateurs(reservations, sessions, NOW);
  it("additionne la part artisan des réservations confirmées à venir (revenus prévus)", () => {
    expect(k.revenusPrevus).toBe(27.2);
  });
  it("compte les réservations confirmées à venir", () => {
    expect(k.reservationsAVenir).toBe(1);
  });
  it("calcule le remplissage des créneaux des 4 prochaines semaines (places réservées / proposées)", () => {
    expect(k.creneauxAVenir).toBe(2);
    expect(k.tauxRemplissageAVenir).toBe(3 / 8);
  });
  it("n'affiche pas de taux sans créneau à venir", () => {
    expect(indicateurs([], [], NOW).tauxRemplissageAVenir).toBeNull();
  });
});

describe("réservations par semaine", () => {
  const points = reservationsParSemaine(
    [
      resa("2026-10-19T17:00:00Z"), // semaine en cours
      resa("2026-10-21T17:00:00Z"),
      resa("2026-08-29T08:00:00Z"), // il y a 7 semaines (lundi 24 août)
      resa("2026-08-20T08:00:00Z"), // hors période
      resa("2026-11-18T18:00:00Z"), // dans 4 semaines
      resa("2026-11-04T18:00:00Z", { statut: "annulee_cliente" }),
    ],
    NOW,
  );
  it("couvre 8 semaines passées (dont la semaine en cours) et 4 à venir", () => {
    expect(points).toHaveLength(12);
    expect(points[0]!.lundi).toBe("2026-08-31");
    expect(points[7]!.lundi).toBe("2026-10-19");
    expect(points.filter((p) => p.aVenir).map((p) => p.lundi)).toEqual(["2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16"]);
  });
  it("compte les réservations confirmées par semaine de séance", () => {
    expect(points[7]!.reservations).toBe(2);
    expect(points[11]!.reservations).toBe(1);
    expect(points.reduce((s, p) => s + p.reservations, 0)).toBe(3);
  });
  it("résume le graphique en texte", () => {
    expect(resumeSemaines(points)).toContain("Sur les 8 dernières semaines : 2 réservations");
    expect(resumeSemaines(points)).toContain("4 semaines à venir : 1");
    expect(resumeSemaines(points)).toContain("soit 0,3 par semaine");
  });
});

describe("remplissage par créneau", () => {
  const points = remplissageParCreneau([
    session("2026-10-19T17:00:00Z", 1), // lundi 19 h (heure d'été)
    session("2026-11-02T18:00:00Z", 0), // lundi 19 h (heure d'hiver)
    session("2026-10-17T08:00:00Z", 4), // samedi 10 h
    session("2026-10-24T08:00:00Z", 3),
    session("2026-10-21T17:00:00Z", 2, 0), // aucune place Creazio : ignoré
  ]);
  it("regroupe par jour et horaire de Paris, malgré le changement d'heure", () => {
    expect(points.map((p) => p.libelle)).toEqual(["Lundi 19h00", "Samedi 10h00"]);
    expect(points[0]).toMatchObject({ reservees: 1, proposees: 8, seances: 2, creux: true });
    expect(points[1]).toMatchObject({ taux: 7 / 8, creux: false });
  });
  it("résume le graphique en texte, créneaux creux compris", () => {
    expect(resumeCreneaux(points)).toBe(
      "Créneau le plus rempli : Samedi 10h00 (88 %). Créneau creux, à moins de 50 % : Lundi 19h00 (13 %).",
    );
  });
});

describe("messages d'erreur du dashboard", () => {
  it("explique qu'il est réservé aux artisans", () => {
    expect(messageTableauDeBord({ code: "ROLE_INTERDIT" })).toBe("Ce tableau de bord est réservé aux comptes artisans.");
    expect(messageTableauDeBord(new Error("x"))).toMatch(/Impossible de charger/);
  });
});

describe("versements mensuels (le 15 du mois suivant)", () => {
  const versements = [
    { id: "v8", montant_eur: 54.4, virement_effectue_le: "2026-09-15T08:00:00Z", reference_virement: "VIR-08" },
    { id: "v9", montant_eur: 27.2, virement_effectue_le: "2026-10-15T08:00:00Z", reference_virement: "VIR-09" },
  ];
  const reservations = [
    resa("2026-08-29T08:00:00Z", { versee: true }),
    resa("2026-08-30T13:00:00Z", { versee: true }),
    resa("2026-09-12T17:00:00Z", { versee: true }),
    resa("2026-10-03T08:00:00Z"),
    resa("2026-10-17T17:00:00Z"),
    resa("2026-10-17T17:00:00Z", { statut: "annulee_cliente" }),
    resa("2026-10-28T18:00:00Z"), // à venir : hors bloc « Passé »
  ];
  it("gère le passage d'année et nomme les mois", () => {
    expect(moisSuivant("2026-12")).toBe("2027-01");
    expect(libelleMois("2026-08")).toBe("Août 2026");
  });
  it("résume chaque mois passé, du plus récent au plus ancien, avec son statut", () => {
    expect(versementsParMois(reservations, versements, NOW)).toEqual([
      { mois: "2026-10", libelle: "Octobre 2026", reservations: 2, montant: 54.4, verse: false, statut: "À verser le 15/11" },
      { mois: "2026-09", libelle: "Septembre 2026", reservations: 1, montant: 27.2, verse: true, statut: "Versé le 15/10" },
      { mois: "2026-08", libelle: "Août 2026", reservations: 2, montant: 54.4, verse: true, statut: "Versé le 15/09" },
    ]);
  });
  it("annonce le prochain versement des réservations passées non versées", () => {
    expect(prochainVersement(reservations, NOW)).toEqual({ montant: 54.4, date: "15 novembre", reservations: 2 });
    expect(prochainVersement([resa("2026-09-12T17:00:00Z", { versee: true })], NOW)).toBeNull();
  });
  it("liste les réservations passées confirmées, de la plus récente à la plus ancienne", () => {
    const passees = reservationsPassees(reservations, NOW);
    expect(passees).toHaveLength(5);
    expect(passees[0]!.debut_le).toBe("2026-10-17T17:00:00Z");
  });
  it("ne garde que les semaines passées pour le graphique du bloc « Passé »", () => {
    const points = reservationsParSemaine(reservations, NOW, 0);
    expect(points.some((p) => p.aVenir)).toBe(false);
    expect(resumeSemaines(points)).not.toContain("à venir");
  });
});
