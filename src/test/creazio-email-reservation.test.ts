import { describe, expect, it } from "vitest";
import {
  LIEN_RESERVATIONS,
  construireEmailConfirmation,
  echapper,
  formatDateSession,
} from "../../supabase/functions/envoyer-confirmation-reservation/email";

const donnees = {
  prenom: "Léa",
  atelier: "Initiation au vitrail",
  artisan: "Atelier Lumière",
  debutLe: "2026-10-31T13:30:00Z",
  finLe: "2026-10-31T16:30:00Z",
  adresse: "8 Rue de la Roquette, 75011 Paris",
  creditsDebites: 42,
  codeCreazio: "CRZ-EX78FN",
  delaiAnnulationHeures: 48,
};

describe("email de confirmation de réservation", () => {
  const email = construireEmailConfirmation(donnees);
  it("contient toutes les informations demandées", () => {
    for (const morceau of [
      "Votre atelier est réservé",
      "Bonjour Léa,",
      "Initiation au vitrail",
      "Atelier Lumière",
      "Samedi 31 octobre 2026, de 14:30 à 17:30",
      "8 Rue de la Roquette, 75011 Paris",
      "42 crédits débités",
      "CRZ-EX78FN",
      "Annulation gratuite jusqu’à 48 h avant, depuis Mes réservations.",
      `href="${LIEN_RESERVATIONS}"`,
    ])
      expect(email.html).toContain(morceau);
    expect(LIEN_RESERVATIONS).toBe("https://www.creazio.fr/espace-eleve/reservations");
    expect(email.sujet).toBe("Votre atelier est réservé : Initiation au vitrail");
    expect(email.html).toContain('lang="fr"');
  });
  it("affiche l'heure de Paris, y compris en heure d'été", () => {
    expect(formatDateSession("2026-07-04T08:00:00Z", "2026-07-04T10:00:00Z")).toBe(
      "Samedi 4 juillet 2026, de 10:00 à 12:00",
    );
  });
  it("propose une version texte brut complète", () => {
    expect(email.texte).toContain("Votre code Creazio : CRZ-EX78FN");
    expect(email.texte).toContain(LIEN_RESERVATIONS);
    expect(email.texte).not.toContain("<");
  });
  it("échappe les données saisies par les utilisateurs", () => {
    const piege = construireEmailConfirmation({ ...donnees, prenom: "<script>x</script>", atelier: 'Bois & "fer"' });
    expect(piege.html).not.toContain("<script>");
    expect(piege.html).toContain("&lt;script&gt;");
    expect(piege.html).toContain("Bois &amp; &quot;fer&quot;");
    expect(echapper("l'atelier")).toBe("l&#39;atelier");
  });
  it("s'adapte à l'absence d'artisan et au singulier", () => {
    const e = construireEmailConfirmation({ ...donnees, artisan: null, creditsDebites: 1, prenom: " " });
    expect(e.html).not.toContain("Artisan");
    expect(e.html).toContain("1 crédit débité<");
    expect(e.texte).toContain("Bonjour,");
  });
});
