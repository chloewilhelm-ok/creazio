import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { libellePlaces } from "@/components/creazio/workshop-slots";

describe("places restantes d'un créneau", () => {
  it("alerte quand il reste peu de places", () => {
    expect(libellePlaces(1)).toBe("Plus qu’une place");
    expect(libellePlaces(2)).toBe("Plus que 2 places");
  });
  it("affiche le nombre de places sinon", () => {
    expect(libellePlaces(4)).toBe("4 places disponibles");
  });
});

import { photoParSavoirFaire } from "@/lib/photos-ateliers";
describe("photo d'un atelier « Lancement prochainement »", () => {
  it("prend une photo du savoir-faire plutôt que la poterie par défaut, et garde une vraie photo si elle existe", () => {
    expect(photoParSavoirFaire(null, "textile", "Broderie")).toMatchObject({ src: "/ateliers/broderie.jpg", secours: "/ateliers/tissage.jpg" });
    expect(photoParSavoirFaire(null, "metal", "Forge").src).toBe("/ateliers/forge.jpg");
    expect(photoParSavoirFaire(null, "papier", "Calligraphie").alt).toContain("Plume");
    expect(photoParSavoirFaire("/ateliers/x.jpg", "metal", "Forge").src).toBe("/ateliers/x.jpg");
  });
});
