import type { CSSProperties } from "react";
import {
  Amphora,
  Check,
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

/**
 * Grille des savoir-faire : une icône dans une pastille colorée et le nom.
 * Sans `onChange`, simple présentation (landing, 2 lignes sur ordinateur) ; avec `onChange`, chaque
 * savoir-faire devient un bouton à cocher (aria-pressed) et la grille s'adapte à la largeur de son conteneur.
 */
export function SavoirFaireGrid({
  className,
  values,
  onChange,
  describedBy,
}: {
  className?: string;
  values?: string[];
  onChange?: (values: string[]) => void;
  describedBy?: string;
}) {
  const colonnes = { "--colonnes": Math.ceil(craftCategories.length / 2) } as CSSProperties;
  if (onChange) {
    const choisis = values ?? [];
    return (
      <div className={cn("@container", className)}>
        <ul className="grid grid-cols-3 gap-2 @md:grid-cols-4 @3xl:grid-cols-6">
          {craftCategories.map((categorie, i) => {
            const Icone = iconeSavoirFaire[categorie];
            const choisi = choisis.includes(categorie);
            return (
              <li key={categorie}>
                <button
                  type="button"
                  aria-pressed={choisi}
                  aria-describedby={describedBy}
                  onClick={() =>
                    onChange(choisi ? choisis.filter((c) => c !== categorie) : [...choisis, categorie])
                  }
                  className={cn(
                    "flex size-full flex-col items-center gap-2 rounded-xl border-2 p-2 pb-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest focus-visible:ring-offset-2",
                    choisi ? "border-primary bg-primary/5" : "border-transparent hover:border-border",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative grid size-12 place-items-center rounded-full text-deep-forest md:size-14",
                      PASTILLES[i % PASTILLES.length],
                    )}
                  >
                    <Icone className="size-5 md:size-6" />
                    {choisi && (
                      <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden="true"/>
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight text-foreground sm:text-sm">
                    {categorie}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
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
