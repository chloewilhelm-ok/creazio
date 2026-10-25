import { describe, expect, it } from "vitest";
import { creditsSansRemise } from "@/lib/reservations";
import {
  DESTINATAIRE,
  RAPPEL,
  construireEmailAlerte,
  libellePrix,
  lienLigneSupabase,
} from "../../supabase/functions/alerter-verification-atelier/email";

describe("crédits sans remise (prix barré côté élève)", () => {
  it("reprend le prix public, 1 crédit = 1 €", () => {
    expect(creditsSansRemise(40, 28)).toBe(40);
    expect(creditsSansRemise("45.00", 32)).toBe(45);
  });
  it("n'affiche rien si le prix public est absent ou pas plus élevé", () => {
    expect(creditsSansRemise(null, 28)).toBeNull();
    expect(creditsSansRemise(undefined, 28)).toBeNull();
    expect(creditsSansRemise("", 28)).toBeNull();
    expect(creditsSansRemise(28, 28)).toBeNull();
    expect(creditsSansRemise(20, 28)).toBeNull();
  });
});

describe("alerte « atelier à vérifier »", () => {
  const id = "3f2b9c1e-8a4d-4e6f-9b7a-1c2d3e4f5a6b";
  it("part toujours à contact@creazio.fr", () => {
    expect(DESTINATAIRE).toBe("contact@creazio.fr");
  });
  it("contient l'artisan, le titre, le prix appliqué, le lien et le rappel", () => {
    const e = construireEmailAlerte({ atelierId: id, titre: "Initiation au vitrail", artisan: "Atelier Lumière", prixPublicEur: 70 });
    expect(e.sujet).toBe("À vérifier : « Initiation au vitrail » (Atelier Lumière)");
    for (const t of [e.texte, e.html]) {
      expect(t).toContain("Atelier Lumière");
      expect(t).toContain("Initiation au vitrail");
      expect(t).toContain("70 € TTC");
      expect(t).toContain(RAPPEL);
    }
    expect(e.texte).toContain(lienLigneSupabase(id));
    expect(lienLigneSupabase(id)).toBe(`https://supabase.com/dashboard/project/fljqrpshvlldtuseoogb/editor/17836?schema=public&filter=id%3Aeq%3A${id}`);
  });
  it("signale un prix manquant et échappe le HTML", () => {
    expect(libellePrix(null)).toContain("à fixer");
    const e = construireEmailAlerte({ atelierId: id, titre: "<b>Bol</b>", artisan: null, prixPublicEur: null });
    expect(e.html).not.toContain("<b>Bol</b>");
    expect(e.html).toContain("&lt;b&gt;Bol&lt;/b&gt;");
    expect(e.texte).toContain("Artisan inconnu");
  });
});
