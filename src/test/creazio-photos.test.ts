import { describe, expect, it } from "vitest";
import { photoAtelier } from "@/lib/photos-ateliers";

describe("photos des ateliers", () => {
  it("décrit ce que montre la photo, pas le titre de l'atelier", () => {
    expect(photoAtelier("/ateliers/vitrail.jpg", "Initiation au vitrail").alt).toBe(
      "Vitrail aux verres rouges, bleus et jaunes projetant sa lumière colorée sur un mur",
    );
  });
  it("utilise la photo de poterie, décrite, quand l'atelier n'a pas de photo", () => {
    expect(photoAtelier(null, "Atelier de poterie").alt).toBe(
      "Mains façonnant un vase en terre sur un tour de potier",
    );
  });
  it("garde un texte alternatif pour une photo non répertoriée", () => {
    expect(photoAtelier("/ateliers/autre.jpg", "Atelier test").alt).toBe(
      "Photo de l’atelier « Atelier test »",
    );
  });
});
