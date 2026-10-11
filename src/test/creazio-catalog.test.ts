import { describe, expect, it } from "vitest";
import { craftCategories, craftTechniques, emptyAddress, newWorkshop, toggleSelection, upsertWorkshop } from "@/components/creazio/catalog";

describe("Creazio shared interests and artisan details", () => {
  it("allows selecting and removing the same inspiration", () => {
    expect(toggleSelection(["Cuir"], "Bois")).toEqual(["Cuir", "Bois"]);
    expect(toggleSelection(["Cuir", "Bois"], "Cuir")).toEqual(["Bois"]);
  });
  it("provides precise techniques for all shared craft categories", () => {
    expect(Object.keys(craftTechniques)).toEqual([...craftCategories]);
    expect(craftTechniques["Poterie et Céramique"]).toContain("Tournage");
    expect(craftTechniques.Cuir).toContain("Maroquinerie");
  });
  it("prefills new workshops with the artisan location and expertise", () => {
    const workshop = newWorkshop({ name: "Atelier", address: { street: "12 rue des Fleurs", postcode: "75011", city: "Paris", access: "Cour" }, categories: ["Cuir"], techniques: ["Couture sellier"], expertise: "Cuir" });
    expect(workshop.address).toEqual({ street: "12 rue des Fleurs", postcode: "75011", city: "Paris", access: "Cour" });
    expect(workshop.category).toBe("Cuir");
    expect(workshop.technique).toBe("Couture sellier");
  });
  it("updates an atelier without duplicating its planning entry", () => {
    const workshop = { ...newWorkshop({ name: "", address: emptyAddress, categories: [], techniques: [], expertise: "" }), id: "atelier-1", title: "Original" };
    const updated = upsertWorkshop([workshop], { ...workshop, title: "Modifié" });
    expect(updated).toHaveLength(1);
    expect(updated[0].title).toBe("Modifié");
  });
});