import pottery from "@/assets/creazio-pottery.jpg";

/**
 * Textes alternatifs des photos d'ateliers (accessibilité) : ils décrivent ce que montre l'image,
 * le titre de l'atelier étant déjà affiché à côté. Les photos sont servies depuis public/ateliers/.
 */
const DESCRIPTIONS: Record<string, string> = {
  "/ateliers/biere.jpg": "Bière ambrée versée depuis une tireuse dans un verre tenu à la main",
  "/ateliers/pain-levain.jpg":
    "Deux mains tenant un pain au levain coupé en deux, à la mie alvéolée",
  "/ateliers/vitrail.jpg":
    "Vitrail aux verres rouges, bleus et jaunes projetant sa lumière colorée sur un mur",
  "/ateliers/bougies.jpg":
    "Quatre bougies coulées dans des pots en céramique, posées sur une planche en bois",
  "/ateliers/reliure.jpg": "Pile de carnets reliés à couverture noire, vus par la tranche",
  "/ateliers/bijouterie.jpg":
    "Bijoutière à son établi examinant des bagues en argent glissées sur ses doigts",
  "/ateliers/cuir.jpg":
    "Mains cousant une pièce de cuir au fil ciré, maintenue dans une pince en bois",
  "/ateliers/tissage.jpg":
    "Mains passant des fils colorés sur un métier à tisser, motifs géométriques roses et bleus",
  "/ateliers/bois.jpg": "Main gantée sculptant un morceau de bois à la gouge, entourée de copeaux",
  "/ateliers/terrarium.jpg":
    "Mains plantant une succulente dans un terrarium en verre géométrique, sur une table d'atelier",
};
const DESCRIPTION_PAR_DEFAUT = "Mains façonnant un vase en terre sur un tour de potier";

/** Photo d'un atelier et sa description ; sans photo, l'image de poterie par défaut. */
export function photoAtelier(
  photoUrl: string | null | undefined,
  titre: string,
): { src: string; alt: string } {
  if (!photoUrl) return { src: pottery, alt: DESCRIPTION_PAR_DEFAUT };
  return { src: photoUrl, alt: DESCRIPTIONS[photoUrl] ?? `Photo de l’atelier « ${titre} »` };
}
