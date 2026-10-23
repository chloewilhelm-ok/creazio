import type { CSSProperties } from "react";
import {
  Amphora,
  Croissant,
  Flame,
  Gem,
  GlassWater,
  Hammer,
  Leaf,
  ScrollText,
  Shirt,
  TreePine,
  Wallet,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { craftCategories, type CraftCategory } from "./catalog";

/** Icône de chaque savoir-faire du catalogue partagé (le typage impose une icône par catégorie). */
export const iconeSavoirFaire: Record<CraftCategory, LucideIcon> = {
  "Poterie et Céramique": Amphora,
  "À manger": Croissant,
  Textile: Shirt,
  Bois: TreePine,
  "À boire": Wine,
  Végétal: Leaf,
  Papier: ScrollText,
  "Bien-être": Flame,
  Bijouterie: Gem,
  Métal: Hammer,
  Cuir: Wallet,
  Verre: GlassWater,
};

// Pastilles aux teintes claires du design system : texte Deep Forest lisible sur chacune (contraste > 9:1).
const PASTILLES = ["bg-sable", "bg-menthe", "bg-abricot", "bg-rose-argile"];

/** Grille des savoir-faire : une icône dans une pastille colorée et le nom, sur 2 lignes à partir de l'ordinateur. */
export function SavoirFaireGrid({ className }: { className?: string }) {
  const colonnes = { "--colonnes": Math.ceil(craftCategories.length / 2) } as CSSProperties;
  return (
    <ul
      style={colonnes}
      className={cn(
        "grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 lg:[grid-template-columns:repeat(var(--colonnes),minmax(0,1fr))]",
        className,
      )}
    >
      {craftCategories.map((categorie, i) => {
        const Icone = iconeSavoirFaire[categorie];
        return (
          <li key={categorie} className="flex flex-col items-center gap-2 text-center">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-12 place-items-center rounded-full text-deep-forest md:size-14",
                PASTILLES[i % PASTILLES.length],
              )}
            >
              <Icone className="size-5 md:size-6" />
            </span>
            <span className="text-xs font-medium leading-tight text-foreground sm:text-sm">
              {categorie}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
