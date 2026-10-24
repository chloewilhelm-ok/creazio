import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { formatDistance } from "@/lib/workshops";

describe("affichage des distances", () => {
  it("arrondit à 1 décimale avec la virgule française", () => {
    expect(formatDistance(7.120099993395939)).toBe("7,1 km");
    expect(formatDistance(2.96)).toBe("3 km");
    expect(formatDistance(12.04)).toBe("12 km");
  });
  it("affiche les distances de moins de 1 km en mètres, arrondis à la dizaine", () => {
    expect(formatDistance(0.8499)).toBe("850 m");
    expect(formatDistance(0.004)).toBe("0 m");
    expect(formatDistance(0.123)).toBe("120 m");
  });
  it("passe en kilomètres dès que l'arrondi atteint 1 000 m", () => {
    expect(formatDistance(0.996)).toBe("1 km");
    expect(formatDistance(1)).toBe("1 km");
  });
});
