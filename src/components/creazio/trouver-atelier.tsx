import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { photoAtelier } from "@/lib/photos-ateliers";
import { formatCredits, formatHeure, formatJour } from "@/lib/reservations";
import { ErreurIA, MESSAGE_IA_PAR_DEFAUT, trouverAtelier } from "@/lib/trouver-atelier";

const LONGUEUR_MAX = 300;
const EXEMPLES = ["Un cadeau pour une amie", "Me détendre loin des écrans", "Une activité à deux"];

/** « Trouve ton atelier idéal », version compacte : une ligne de saisie, des exemples, et les résultats seulement s'il y en a. */
export function TrouveTonAtelier() {
  const [phrase, setPhrase] = useState("");
  const [erreurSaisie, setErreurSaisie] = useState("");
  const recherche = useMutation({ mutationFn: trouverAtelier });
  function lancer(texte: string) {
    if (texte.trim().length < 3) {
      setErreurSaisie("Décrivez votre envie en quelques mots.");
      document.getElementById("ia-phrase")?.focus();
      return;
    }
    setErreurSaisie("");
    recherche.mutate(texte.trim());
  }
  function envoyer(e: FormEvent) {
    e.preventDefault();
    lancer(phrase);
  }
  const resultat = recherche.data;
  return (
    <section aria-labelledby="ia-titre" className="mb-8 rounded-2xl border bg-card p-4 md:p-5">
      <h2 id="ia-titre" className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
        Trouve ton atelier idéal
      </h2>
      <form noValidate onSubmit={envoyer} className="mt-3">
        <label htmlFor="ia-phrase" className="sr-only">Décrivez votre envie</label>
        <div className="flex gap-2">
          <Input
            id="ia-phrase"
            value={phrase}
            maxLength={LONGUEUR_MAX}
            onChange={(e) => { setPhrase(e.target.value); setErreurSaisie(""); }}
            aria-invalid={Boolean(erreurSaisie)}
            aria-describedby={erreurSaisie ? "ia-phrase-erreur ia-mention" : "ia-mention"}
            placeholder="Décrivez votre envie : un cadeau, un moment entre amis, une matière à découvrir…"
            className="h-11 flex-1"
          />
          <Button type="submit" className="h-11 shrink-0" disabled={recherche.isPending}>
            {recherche.isPending ? "Recherche…" : "Trouver"}
          </Button>
        </div>
        {erreurSaisie && <p id="ia-phrase-erreur" className="mt-2 text-sm font-medium text-destructive">{erreurSaisie}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {EXEMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setPhrase(ex); lancer(ex); }}
              disabled={recherche.isPending}
              className="label-font rounded-full bg-sable px-3 py-1 text-xs text-foreground transition hover:bg-abricot focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
        <p id="ia-mention" className="mt-2 text-xs text-muted-foreground">
          Suggestions par IA (Google Gemini) parmi les ateliers disponibles · ni votre nom ni votre adresse ne lui sont transmis · 10 demandes par heure.
        </p>
      </form>
      <div aria-live="polite">
        {recherche.isPending && <p role="status" className="mt-3 text-sm text-muted-foreground">L’assistant cherche les ateliers qui vous correspondent…</p>}
        {recherche.isError && (
          <p role="alert" className="mt-3 rounded-xl bg-erreur-fond p-3 text-sm text-erreur-texte">
            {recherche.error instanceof ErreurIA ? recherche.error.message : MESSAGE_IA_PAR_DEFAUT}
          </p>
        )}
        {resultat && !recherche.isPending && (
          resultat.suggestions.length ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {resultat.suggestions.map((s) => {
                const photo = photoAtelier(s.photo_url, s.titre);
                return (
                  <li key={s.atelier_id}>
                    <Link
                      to="/ateliers/$workshopId"
                      params={{ workshopId: s.atelier_id }}
                      className="flex h-full gap-3 rounded-xl border bg-background p-3 transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest"
                    >
                      <img src={photo.src} alt={photo.alt} className="size-16 shrink-0 rounded-lg object-cover" />
                      <span className="grid content-start gap-1">
                        <span className="text-sm font-semibold">{s.titre}</span>
                        <span className="text-xs text-foreground">{s.raison}</span>
                        <span className="label-font text-[11px] text-muted-foreground">
                          {s.lieu} · {formatJour(s.prochaine_session)} {formatHeure(s.prochaine_session)} · dès {formatCredits(s.prix_min_credits)}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">Voir l’atelier <ArrowRight className="size-3.5" aria-hidden="true" /></span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
              {resultat.message} <Link to="/ateliers" className="font-semibold text-primary underline underline-offset-4">Explorer tous les ateliers</Link>
            </p>
          )
        )}
      </div>
    </section>
  );
}
