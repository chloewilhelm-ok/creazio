import { describe, expect, it } from "vitest";
import { packs } from "@/components/creazio/pages";

// Règle décidée : 1 crédit = 1 € (50 € = 50 crédits, 100 € = 100, 150 € = 150).
describe("Credit pack equivalence", () => {
  it("converts each price to the agreed number of credits", () => {
    expect(packs.map((p) => `${p.price} € = ${p.credits} credits`)).toEqual([
      "50 € = 50 credits",
      "100 € = 100 credits",
      "150 € = 150 credits",
    ]);
  });
  it("keeps the popular pack at 100 € for 100 credits", () => {
    const popular = packs.find((p) => p.popular);
    expect(popular).toMatchObject({ price: 100, credits: 100 });
  });
});
