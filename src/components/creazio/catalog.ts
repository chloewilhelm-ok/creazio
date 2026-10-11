export const craftCategories = ["Poterie et Céramique", "À manger", "Textile", "Bois", "À boire", "Végétal", "Papier", "Bien-être", "Bijouterie", "Métal", "Cuir", "Verre"] as const;
export type CraftCategory = typeof craftCategories[number];
export const craftTechniques: Record<CraftCategory, readonly string[]> = {
  "Poterie et Céramique": ["Tournage", "Modelage", "Émaillage", "Décor sur céramique"],
  "À manger": ["Pâtisserie", "Boulangerie", "Chocolaterie", "Cuisine"],
  Textile: ["Couture", "Broderie", "Tissage", "Teinture"],
  Bois: ["Ébénisterie", "Sculpture sur bois", "Tournage sur bois", "Marqueterie"],
  "À boire": ["Brassage", "Œnologie", "Mixologie", "Torréfaction"],
  Végétal: ["Composition florale", "Terrarium", "Jardinage", "Vannerie"],
  Papier: ["Linogravure", "Sérigraphie", "Reliure", "Origami"],
  "Bien-être": ["Savonnerie", "Parfumerie", "Cosmétiques naturels", "Bougies"],
  Bijouterie: ["Assemblage de bijoux", "Joaillerie", "Travail de l’argent", "Cire perdue"],
  Métal: ["Forge", "Soudure", "Ciselure", "Dinanderie"],
  Cuir: ["Maroquinerie", "Couture sellier", "Teinture du cuir", "Repoussage"],
  Verre: ["Vitrail", "Soufflage du verre", "Fusing", "Perles au chalumeau"],
};
export function toggleSelection(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}
export interface Address { street: string; postcode: string; city: string; access: string }
export interface ArtisanInfo { name: string; address: Address; categories: string[]; techniques: string[]; expertise: string }
export interface WorkshopDraft {
  id: string; title: string; category: string; technique: string; description: string;
  duration: string; capacity: string; price: string; discount: string; materials: string;
  level: string; address: Address; date: string; endDate: string; days: string[]; allocation: string; time: string; image: string; status: "draft" | "published";
}
export const emptyAddress: Address = { street: "", postcode: "", city: "", access: "" };
export function newWorkshop(artisan: ArtisanInfo): WorkshopDraft {
  return { id: "", title: "", category: artisan.categories[0] ?? "", technique: artisan.techniques[0] ?? "", description: "", duration: "", capacity: "", price: "", discount: "", materials: "", level: "Tous niveaux", address: { ...artisan.address }, date: "", endDate: "", days: [], allocation: "", time: "", image: "", status: "draft" };
}
export function upsertWorkshop(workshops: WorkshopDraft[], workshop: WorkshopDraft): WorkshopDraft[] {
  return workshops.some(item => item.id === workshop.id) ? workshops.map(item => item.id === workshop.id ? workshop : item) : [...workshops, workshop];
}
// Valeurs de l’énumère Postgres public.savoir_faire (base Supabase de l’utilisateur).
export type SavoirFaire = "poterie_ceramique" | "textile" | "bois" | "vegetal" | "papier" | "cosmetique_bien_etre" | "bijouterie" | "metal" | "cuir" | "verre" | "pierre" | "agriculture" | "a_manger" | "a_boire";
export const savoirFaireByCategory: Record<CraftCategory, SavoirFaire> = {
  "Poterie et Céramique": "poterie_ceramique",
  "À manger": "a_manger",
  Textile: "textile",
  Bois: "bois",
  "À boire": "a_boire",
  Végétal: "vegetal",
  Papier: "papier",
  "Bien-être": "cosmetique_bien_etre",
  Bijouterie: "bijouterie",
  Métal: "metal",
  Cuir: "cuir",
  Verre: "verre",
};