import { describe, expect, it } from "vitest";
import { RAYON_RECOMMANDATION_KM, distanceKm } from "@/lib/workshops";
describe("ateliers recommandés", () => {
  it("rayon par défaut de 5 km", () => expect(RAYON_RECOMMANDATION_KM).toBe(5));
  it("Paris 11e (Roquette) – Paris 18e (Lamarck) est hors rayon", () => {
    expect(distanceKm({ lat: 48.8553, lon: 2.3736 }, { lat: 48.8897, lon: 2.3394 })).toBeGreaterThan(4);
  });
  it("Bastille – République est dans le rayon", () => {
    expect(distanceKm({ lat: 48.8532, lon: 2.3692 }, { lat: 48.8674, lon: 2.3637 })).toBeLessThan(RAYON_RECOMMANDATION_KM);
  });
});
