import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Coins, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { photoAtelier } from "@/lib/photos-ateliers";
import { formatCredits, formatHeure, formatJour } from "@/lib/reservations";
import { ErreurIA, MESSAGE_IA_PAR_DEFAUT, trouverAtelier } from "@/lib/trouver-atelier";

const LONGUEUR_MAX = 300;
const EXEMPLES = ["Un cadeau fait main pour l’anniversaire de ma mère", "Me détendre après le travail, loin des écrans", "Une activité à deux le week-end"];

/** « Trouve ton atelier idéal » : l'élève décrit son envie, Gemini propose jusqu'à 3 ateliers disponibles. */
export function TrouveTonAtelier() {
  const [phrase, setPhrase] = useState("");
  const [erreurSaisie, setErreurSaisie] = useState("");
  const recherche = useMutation({ mutationFn: trouverAtelier });
  function envoyer(e: FormEvent) {
    e.preventDefault();
    if (phrase.trim().length < 3) {
      setErreurSaisie("Décrivez votre envie en quelques mots.");
      document.getElementById("ia-phrase")?.focus();
      return;
    }
    setErreurSaisie("");
    recherche.mutate(phrase.trim());
  }
  const resultat = recherche.data;
  return (
    <section aria-labelledby="ia-titre" className="mb-10 rounded-2xl border bg-card p-5 shadow-sm md:p-8">
      <h2 id="ia-titre" className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
        Trouve ton atelier idéal
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Décrivez votre envie : l’assistant choisit pour vous parmi les ateliers qui ont encore des places.</p>
      <form noValidate onSubmit={envoyer} className="mt-5 grid gap-3">
        <label htmlFor="ia-phrase" className="text-sm font-semibold">Votre envie</label>
        <Textarea
          id="ia-phrase"
          value={phrase}
          maxLength={LONGUEUR_MAX}
          onChange={(e) => { setPhrase(e.target.value); setErreurSaisie(""); }}
          aria-invalid={Boolean(erreurSaisie)}
          aria-describedby={[erreurSaisie ? "ia-phrase-erreur" : "", "ia-phrase-compteur"].filter(Boolean).join(" ")}
          placeholder="Par exemple : un atelier calme pour apprendre à faire mes propres bougies"
          className="min-h-24 rounded-lg"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span id="ia-phrase-compteur">{phrase.length} / {LONGUEUR_MAX} caractères</span>
        </div>
        {erreurSaisie && <p id="ia-phrase-erreur" className="text-sm font-medium text-destructive">{erreurSaisie}</p>}
        <div className="flex flex-wrap gap-2" aria-label="Exemples d’envies">
          {EXEMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => { setPhrase(ex); setErreurSaisie(""); }} className="rounded-full border px-3 py-1.5 text-xs text-foreground transition hover:bg-sable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest">
              {ex}
            </button>
          ))}
        </div>
        <Button type="submit" className="justify-self-start" disabled={recherche.isPending}>
          {recherche.isPending ? "Recherche…" : "Trouver mon atelier"} {!recherche.isPending && <ArrowRight />}
        </Button>
        <p className="text-xs text-muted-foreground">
          Suggestions générées par une IA (Google Gemini) à partir des ateliers disponibles. Seuls votre phrase et votre arrondissement lui sont transmis, jamais votre nom ni votre adresse. 10 demandes par heure.
        </p>
      </form>
      <div aria-live="polite" className="mt-6">
        {recherche.isPending && <p role="status" className="text-sm text-muted-foreground">L’assistant cherche les ateliers qui vous correspondent…</p>}
        {recherche.isError && (
          <p role="alert" className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">
            {recherche.error instanceof ErreurIA ? recherche.error.message : MESSAGE_IA_PAR_DEFAUT}
          </p>
        )}
        {resultat && !recherche.isPending && (
          resultat.suggestions.length ? (
            <>
              {resultat.message && <p className="mb-4 text-sm text-muted-foreground">{resultat.message}</p>}
              <ul className="grid gap-4 md:grid-cols-3">
                {resultat.suggestions.map((s) => {
                  const photo = photoAtelier(s.photo_url, s.titre);
                  return (
                    <li key={s.atelier_id} className="flex flex-col overflow-hidden rounded-2xl border bg-background">
                      <img src={photo.src} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <p className="label-font text-[10px] font-semibold uppercase text-primary">{s.savoir_faire}</p>
                        <h3 className="font-semibold">{s.titre}</h3>
                        <p className="text-sm">{s.raison}</p>
                        <ul className="mt-1 grid gap-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{s.lieu}</li>
                          <li className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />Prochain créneau : {formatJour(s.prochaine_session)} à {formatHeure(s.prochaine_session)}</li>
                          <li className="flex items-center gap-1.5"><Coins className="size-3.5" aria-hidden="true" />À partir de {formatCredits(s.prix_min_credits)}</li>
                        </ul>
                        <Button asChild variant="outline" size="sm" className="mt-auto self-start">
                          <Link to="/ateliers/$workshopId" params={{ workshopId: s.atelier_id }}>Voir l’atelier<span className="sr-only"> « {s.titre} »</span></Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="rounded-xl bg-muted p-4 text-sm">{resultat.message} <Link to="/ateliers" className="font-semibold text-primary underline underline-offset-4">Explorer tous les ateliers</Link></p>
          )
        )}
      </div>
    </section>
  );
}
