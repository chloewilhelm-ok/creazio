import { describe, expect, it } from "vitest";
import {
  DESTINATAIRE,
  construireEmailCandidature,
  lienCandidature,
} from "../../supabase/functions/alerter-nouvelle-candidature/email";

const id = "6096513d-6fc5-4791-9274-dce70cab9a9e";
const donnees = { profileId: id, nomAtelier: "Forge & Flamme", prenom: "Karim", savoirFaire: "metal", ville: "Montreuil", creeLe: "2026-10-27T09:30:00Z" };

describe("alerte « nouvelle candidature artisan »", () => {
  it("part toujours à contact@creazio.fr", () => {
    expect(DESTINATAIRE).toBe("contact@creazio.fr");
  });
  it("contient l'atelier, le prénom, le savoir-faire, la ville, la date et la marche à suivre", () => {
    const e = construireEmailCandidature(donnees);
    expect(e.sujet).toBe("Nouvelle candidature artisan : Forge & Flamme (Montreuil)");
    for (const t of [e.texte, e.html]) {
      for (const morceau of ["Karim", "Métal", "Montreuil", "27 octobre 2026", "10:30", "statut_candidature", "validee", "Table Editor"]) expect(t).toContain(morceau);
    }
    expect(e.texte).toContain(lienCandidature(id));
    expect(lienCandidature(id)).toBe(`https://supabase.com/dashboard/project/fljqrpshvlldtuseoogb/editor/17768?schema=public&filter=profile_id%3Aeq%3A${id}`);
  });
  it("échappe le HTML et gère un prénom absent", () => {
    const e = construireEmailCandidature({ ...donnees, nomAtelier: "<b>Atelier</b>", prenom: null });
    expect(e.html).not.toContain("<b>Atelier</b>");
    expect(e.texte).toContain("Prénom non renseigné");
  });
});
