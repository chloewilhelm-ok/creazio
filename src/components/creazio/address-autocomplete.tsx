import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { libelleAdresse, rechercherAdresses, type SuggestionAdresse } from "@/lib/adresse";
import type { Address } from "./catalog";

/**
 * Champ d'adresse avec suggestions (motif ARIA « combobox » : flèches, Entrée, Échap).
 * L'adresse n'est retenue que lorsqu'une suggestion est choisie ; toute saisie ensuite l'efface.
 */
export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  onTexteChange,
}: {
  id: string;
  label: string;
  value: Address;
  onChange: (address: Address) => void;
  error?: string | undefined;
  hint?: ReactNode;
  /** Texte tapé (permet de distinguer un champ vide d'une adresse non choisie dans la liste). */
  onTexteChange?: (texte: string) => void;
}) {
  const listId = useId();
  const [texte, setTexte] = useState(() => libelleAdresse(value));
  const [suggestions, setSuggestions] = useState<SuggestionAdresse[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [recherche, setRecherche] = useState(false);
  const saisie = useRef(false);

  useEffect(() => {
    if (!saisie.current) return;
    const controleur = new AbortController();
    const minuteur = setTimeout(async () => {
      setRecherche(true);
      const resultats = await rechercherAdresses(texte, controleur.signal);
      if (controleur.signal.aborted) return;
      setSuggestions(resultats);
      setActif(-1);
      setOuvert(texte.trim().length >= 3);
      setRecherche(false);
    }, 250);
    return () => {
      clearTimeout(minuteur);
      controleur.abort();
    };
  }, [texte]);

  function choisir(s: SuggestionAdresse) {
    saisie.current = false;
    onChange({ ...value, street: s.rue, postcode: s.codePostal, city: s.ville });
    setTexte(s.libelle);
    setOuvert(false);
    setSuggestions([]);
  }

  const hintId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const decrit = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  const listeVisible = ouvert && (suggestions.length > 0 || !recherche);

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listeVisible}
          aria-controls={listId}
          aria-activedescendant={actif >= 0 ? `${listId}-${actif}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={decrit}
          autoComplete="off"
          value={texte}
          placeholder="Commencez à taper votre adresse"
          onChange={(e) => {
            saisie.current = true;
            setTexte(e.target.value);
            onTexteChange?.(e.target.value);
            if (value.street || value.postcode || value.city)
              onChange({ ...value, street: "", postcode: "", city: "" });
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && suggestions.length) {
              e.preventDefault();
              setOuvert(true);
              setActif((i) => (i + 1) % suggestions.length);
            } else if (e.key === "ArrowUp" && suggestions.length) {
              e.preventDefault();
              setOuvert(true);
              setActif((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === "Enter" && listeVisible && actif >= 0 && suggestions[actif]) {
              e.preventDefault();
              choisir(suggestions[actif]);
            } else if (e.key === "Escape") {
              setOuvert(false);
            }
          }}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          className={cn(error && "border-destructive")}
        />
        {listeVisible && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Suggestions d’adresses"
            className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
          >
            {suggestions.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted-foreground">
                Aucune adresse trouvée. Vérifiez le numéro et la rue.
              </li>
            ) : (
              suggestions.map((s, i) => (
                <li
                  key={s.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === actif}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choisir(s);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm",
                    i === actif ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {s.libelle}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="flex items-center gap-2 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
