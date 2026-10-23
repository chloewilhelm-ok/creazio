import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { craftCategories } from "@/components/creazio/catalog";
import { SavoirFaireGrid, iconeSavoirFaire } from "@/components/creazio/savoir-faire-grid";

describe("grille des savoir-faire", () => {
  it("affiche chaque savoir-faire du catalogue avec son nom en texte", () => {
    render(<SavoirFaireGrid />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([...craftCategories]);
  });
  it("masque les icônes aux lecteurs d'écran", () => {
    render(<SavoirFaireGrid />);
    for (const li of screen.getAllByRole("listitem")) {
      expect(li.querySelector("svg")?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(within(li).queryByRole("img")).toBeNull();
    }
  });
  it("prévoit une icône pour chaque catégorie", () => {
    expect(Object.keys(iconeSavoirFaire)).toEqual([...craftCategories]);
  });
});

describe("grille des savoir-faire sélectionnable", () => {
  it("coche et décoche un savoir-faire au clic, état annoncé par aria-pressed", async () => {
    const { fireEvent } = await import("@testing-library/react");
    let valeurs: string[] = ["Bois"];
    const { rerender } = render(<SavoirFaireGrid values={valeurs} onChange={(v) => (valeurs = v)} />);
    expect(screen.getByRole("button", { name: "Bois" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Verre" }));
    expect(valeurs).toEqual(["Bois", "Verre"]);
    rerender(<SavoirFaireGrid values={valeurs} onChange={(v) => (valeurs = v)} />);
    fireEvent.click(screen.getByRole("button", { name: "Bois" }));
    expect(valeurs).toEqual(["Verre"]);
    expect(screen.getAllByRole("button")).toHaveLength(craftCategories.length);
  });
});
