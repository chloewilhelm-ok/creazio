import { describe, expect, it } from "vitest";
import { packs } from "@/components/creazio/pages";

// Credit equivalence the user set: 50 € = 45 credits, 100 € = 90, 150 € = 135.
describe("Credit pack equivalence", () => {
  it("converts each price to the agreed number of credits", () => {
    expect(packs.map((p) => `${p.price} € = ${p.credits} credits`)).toEqual([
      "50 € = 45 credits",
      "100 € = 90 credits",
      "150 € = 135 credits",
    ]);
  });
  it("keeps the popular pack at 100 € for 90 credits", () => {
    const popular = packs.find((p) => p.popular);
    expect(popular).toMatchObject({ price: 100, credits: 90 });
  });
});
