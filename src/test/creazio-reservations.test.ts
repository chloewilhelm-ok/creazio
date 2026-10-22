import { describe, expect, it } from "vitest";
import {
  ReservationError,
  formatCredits,
  messageErreur,
  peutAnnuler,
  toReservationError,
} from "@/lib/reservations";
import { visibleSessions } from "@/lib/workshop-sessions";

describe("messages d'erreur de réservation", () => {
  it("traduit un code métier en phrase pour l'élève", () => {
    const err = toReservationError({
      message: "SOLDE_INSUFFISANT: Il vous faut 32 crédits, votre solde est de 0 crédits.",
    });
    expect(err.code).toBe("SOLDE_INSUFFISANT");
    expect(err.message).toBe("Votre solde de crédits ne suffit pas pour ce créneau.");
  });
  it("ne montre jamais un message technique inconnu", () => {
    const err = toReservationError({ message: "value too long for type character varying(8)" });
    expect(err.code).toBe("INCONNUE");
    expect(err.message).not.toContain("varying");
    expect(messageErreur(new TypeError("Failed to fetch"))).toBe(
      "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
    );
  });
  it("garde le code pour que l'écran réagisse", () => {
    expect(toReservationError({ message: "COMPLET: Il n'y a plus de place." })).toBeInstanceOf(
      ReservationError,
    );
  });
});

describe("annulation gratuite", () => {
  const now = Date.parse("2026-10-22T18:00:00Z");
  it("est possible à plus de 48 h du début", () => {
    expect(peutAnnuler("2026-10-24T19:00:00Z", 48, now)).toBe(true);
  });
  it("est refusée à moins de 48 h du début", () => {
    expect(peutAnnuler("2026-10-24T17:00:00Z", 48, now)).toBe(false);
  });
});

describe("créneaux affichés sur la fiche atelier", () => {
  const now = Date.parse("2026-10-18T06:00:00Z");
  const slot = {
    id: "lundi",
    debut_le: "2026-10-19T17:00:00Z",
    statut: "ouverte" as const,
    places_restantes: 2,
  };
  it("garde les créneaux complets pour les afficher « Complet »", () => {
    expect(visibleSessions([{ ...slot, places_restantes: 0 }], now).map((s) => s.id)).toEqual([
      "lundi",
    ]);
  });
  it("masque les créneaux annulés et passés", () => {
    expect(
      visibleSessions(
        [
          { ...slot, statut: "annulee" },
          { ...slot, debut_le: "2026-10-17T17:00:00Z" },
        ],
        now,
      ),
    ).toEqual([]);
  });
});

describe("affichage des crédits", () => {
  it("accorde le pluriel", () => {
    expect([formatCredits(0), formatCredits(1), formatCredits(32)]).toEqual([
      "0 crédit",
      "1 crédit",
      "32 crédits",
    ]);
  });
});
