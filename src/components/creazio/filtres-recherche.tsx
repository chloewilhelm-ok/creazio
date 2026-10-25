import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  OPTIONS_BUDGET,
  OPTIONS_CRENEAU,
  libelleArrondissement,
  type FiltreBudget,
  type FiltreCreneau,
  type Filtres,
  type VilleCouronne,
} from "@/lib/filtres-recherche";

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
const CLASSE_SELECT =
  "h-11 w-full rounded-lg border border-deep-forest/15 bg-coquille px-3 text-sm text-foreground focus-visible:border-deep-forest focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(224,116,94,0.25)]";

interface PropsFiltres {
  filtres: Filtres;
  onChange: (f: Filtres) => void;
  villes: { petite: VilleCouronne[]; grande: VilleCouronne[] };
  nbResultats: number;
  onReinitialiser: () => void;
  onFermer: () => void;
}

/** Les 3 listes du panneau (lieu, budget, créneau) et ses deux boutons. Les filtres s'appliquent tout de suite. */
function ChampsFiltres({ filtres, onChange, villes, nbResultats, onReinitialiser, onFermer }: PropsFiltres) {
  const id = useId();
  const groupe = (titre: string, liste: VilleCouronne[]) => (
    <optgroup label={titre}>
      {liste.length ? (
        liste.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)
      ) : (
        <option disabled value="">Aucun atelier pour le moment</option>
      )}
    </optgroup>
  );
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor={`${id}-lieu`} className="label-font text-sm font-semibold">Lieu</label>
          <select id={`${id}-lieu`} value={filtres.lieu} onChange={(e) => onChange({ ...filtres, lieu: e.target.value })} className={CLASSE_SELECT}>
            <option value="partout">Partout</option>
            <optgroup label="Paris">
              {ARRONDISSEMENTS.map((n) => <option key={n} value={`paris-${n}`}>{libelleArrondissement(n)}</option>)}
            </optgroup>
            {groupe("Petite couronne (92, 93, 94)", villes.petite)}
            {groupe("Grande couronne (77, 78, 91, 95)", villes.grande)}
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor={`${id}-budget`} className="label-font text-sm font-semibold">Budget par séance</label>
          <select id={`${id}-budget`} value={filtres.budget} onChange={(e) => onChange({ ...filtres, budget: e.target.value as FiltreBudget })} className={CLASSE_SELECT}>
            {OPTIONS_BUDGET.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor={`${id}-creneau`} className="label-font text-sm font-semibold">Créneau</label>
          <select id={`${id}-creneau`} value={filtres.creneau} onChange={(e) => onChange({ ...filtres, creneau: e.target.value as FiltreCreneau })} className={CLASSE_SELECT}>
            {OPTIONS_CRENEAU.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onReinitialiser}>Réinitialiser</Button>
        <Button type="button" onClick={onFermer}>
          Voir {nbResultats} {nbResultats > 1 ? "ateliers" : "atelier"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Panneau de filtres : sous la barre de recherche sur ordinateur, en feuille (Sheet) depuis le bas sur mobile.
 */
export function PanneauFiltres({ ouvert, mobile, idPanneau, ...props }: PropsFiltres & { ouvert: boolean; mobile: boolean; idPanneau: string }) {
  if (mobile) {
    return (
      <Sheet open={ouvert} onOpenChange={(o) => { if (!o) props.onFermer(); }}>
        <SheetContent side="bottom" id={idPanneau} className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-background">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Filtrer les ateliers</SheetTitle>
            <SheetDescription>Lieu, budget et créneau se combinent avec le savoir-faire choisi.</SheetDescription>
          </SheetHeader>
          <ChampsFiltres {...props} />
        </SheetContent>
      </Sheet>
    );
  }
  if (!ouvert) return null;
  return (
    <section id={idPanneau} aria-label="Filtres" className="mt-3 rounded-xl border border-deep-forest/10 bg-sable/60 p-5">
      <ChampsFiltres {...props} />
    </section>
  );
}
