import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workshopSessionsQuery } from "@/lib/workshop-sessions";
import { PrixCredits } from "./prix-credits";
import {
  ReservationError,
  formatCredits,
  formatHeure,
  formatJour,
  messageErreur,
  reserverSession,
  walletQuery,
} from "@/lib/reservations";

export function WorkshopSlots({ workshopId, prixPublic }: { workshopId: string; prixPublic?: number | string | null | undefined }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sessionsQuery = useQuery(workshopSessionsQuery(workshopId));
  const wallet = useQuery(walletQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Message gardé quand le créneau choisi n'est plus réservable (le résumé disparaît avec la sélection).
  const [avis, setAvis] = useState("");
  const { data, isPending, error, refetch } = sessionsQuery;
  const selected = data?.find((s) => s.id === selectedId && s.places_restantes > 0) ?? null;

  const reservation = useMutation({
    mutationFn: reserverSession,
    onSuccess: async (res) => {
      queryClient.setQueryData(walletQuery.queryKey, () => ({ solde_credits: res.nouveau_solde }));
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
      await queryClient.invalidateQueries({ queryKey: workshopSessionsQuery(workshopId).queryKey });
      navigate({ to: "/reservation/confirmation", search: { reservation: res.reservation_id } });
    },
    onError: (err) => {
      const code = err instanceof ReservationError ? err.code : "";
      if (code === "SOLDE_INSUFFISANT")
        queryClient.invalidateQueries({ queryKey: walletQuery.queryKey });
      if (code === "COMPLET" || code === "SESSION_PASSEE" || code === "SESSION_FERMEE") {
        setAvis(messageErreur(err));
        setSelectedId(null);
        refetch();
      }
    },
  });

  function choisir(id: string) {
    setSelectedId(id);
    setAvis("");
    reservation.reset();
  }

  return (
    <section className="mt-6" aria-label="Créneaux disponibles">
      <h2 className="font-semibold">Créneaux disponibles</h2>
      {avis && (
        <p role="alert" className="mt-3 rounded-lg bg-erreur-fond p-3 text-sm text-erreur-texte">
          {avis}
        </p>
      )}
      {isPending ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Chargement des créneaux…
        </p>
      ) : error ? (
        <div className="mt-3">
          <p role="alert" className="text-sm text-muted-foreground">
            Impossible de charger les créneaux. Vérifiez votre connexion.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      ) : !data?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun créneau disponible pour le moment.
        </p>
      ) : (
        <ul className="mt-4 max-h-[440px] space-y-3 overflow-y-auto p-1">
          {data.map((slot) => {
            const complet = slot.places_restantes <= 0;
            const actif = slot.id === selected?.id;
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  disabled={complet}
                  aria-pressed={actif}
                  onClick={() => choisir(slot.id)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest focus-visible:ring-offset-2",
                    actif ? "border-primary bg-accent" : "hover:border-primary/50",
                    complet && "cursor-not-allowed opacity-60 hover:border-border",
                  )}
                >
                  <span className="flex items-start justify-between gap-2 text-sm font-semibold">
                    <span className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true"/>
                      {formatJour(slot.debut_le)}
                    </span>
                    {actif && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </span>
                  <span className="label-font mt-2 block text-sm">
                    {formatHeure(slot.debut_le)} – {formatHeure(slot.fin_le)}
                  </span>
                  <JaugePlaces restantes={slot.places_restantes} ouvertes={slot.places_ouvertes_creazio} />
                  <span className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    {complet ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        Complet
                      </span>
                    ) : (
                      <span className="label-font flex items-center gap-1 text-muted-foreground">
                        <Users className="size-4" aria-hidden="true" />
                        {libellePlaces(slot.places_restantes)}
                      </span>
                    )}
                    <PrixCredits credits={slot.prix_credits} prixPublic={prixPublic} className="label-font font-bold text-primary" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected && (
        <BookingSummary
          prix={selected.prix_credits}
          prixPublic={prixPublic}
          wallet={wallet}
          pending={reservation.isPending}
          error={reservation.error}
          onConfirm={() => reservation.mutate(selected.id)}
        />
      )}
    </section>
  );
}

function BookingSummary({
  prix,
  prixPublic,
  wallet,
  pending,
  error,
  onConfirm,
}: {
  prix: number;
  prixPublic?: number | string | null | undefined;
  wallet: UseQueryResult<{ solde_credits: number } | null>;
  pending: boolean;
  error: Error | null;
  onConfirm: () => void;
}) {
  const solde = wallet.data?.solde_credits ?? 0;
  const insuffisant =
    (!wallet.isPending && !wallet.error && solde < prix) ||
    (error instanceof ReservationError && error.code === "SOLDE_INSUFFISANT");
  // Sous 768 px, le bloc est fixé en bas de l'écran ; un espace de même hauteur évite qu'il masque la page.
  const bloc = useRef<HTMLDivElement>(null);
  const [hauteur, setHauteur] = useState(0);
  useEffect(() => {
    const el = bloc.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(() => setHauteur(el.offsetHeight));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <>
    <div aria-hidden="true" className="md:hidden" style={{ height: hauteur }} />
    <div
      ref={bloc}
      aria-live="polite"
      className="mt-5 rounded-xl bg-muted p-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:mt-0 max-md:max-h-[70vh] max-md:overflow-y-auto max-md:rounded-b-none max-md:rounded-t-2xl max-md:border-t max-md:border-deep-forest/10 max-md:bg-card max-md:px-5 max-md:pb-[calc(1rem+env(safe-area-inset-bottom))] max-md:shadow-[0_-8px_24px_-4px_rgba(15,61,58,0.16)]"
    >
      <h3 className="font-semibold">Votre réservation</h3>
      {wallet.isPending ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Chargement de votre solde…
        </p>
      ) : wallet.error ? (
        <div className="mt-3">
          <p role="alert" className="text-sm">
            Impossible de charger votre solde de crédits.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => wallet.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          <dl className="mt-3 grid gap-2 text-sm max-md:mt-2 max-md:gap-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Coût du créneau</dt>
              <dd className="font-semibold"><PrixCredits credits={prix} prixPublic={prixPublic} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Solde actuel</dt>
              <dd>{formatCredits(solde)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2">
              <dt className="text-muted-foreground">Solde après réservation</dt>
              <dd className="font-semibold">{insuffisant ? "—" : formatCredits(solde - prix)}</dd>
            </div>
          </dl>
          {insuffisant ? (
            <div className="mt-4">
              <p role="alert" className="text-sm">
                Votre solde ne suffit pas : il vous manque{" "}
                {formatCredits(Math.max(prix - solde, 1))} pour ce créneau.
              </p>
              <Button asChild className="mt-3 w-full">
                <Link to="/espace-eleve/profil">Acheter des crédits</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button className="mt-4 w-full max-md:mt-3" size="lg" disabled={pending} onClick={onConfirm}>
                {pending ? "Réservation en cours…" : `Confirmer avec ${formatCredits(prix)}`}
              </Button>
              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-erreur-fond p-3 text-sm text-erreur-texte">
                  {messageErreur(error)}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
    </>
  );
}

/** « Plus qu’une place », « Plus que 2 places » quand il en reste peu, sinon « 4 places disponibles ». */
export const libellePlaces = (restantes: number) =>
  restantes === 1 ? "Plus qu’une place" : restantes === 2 ? "Plus que 2 places" : `${restantes} places disponibles`;

/** Jauge de disponibilité (design system) : barre fine de 4 px, remplissage terracotta = places restantes. */
function JaugePlaces({ restantes, ouvertes }: { restantes: number; ouvertes: number }) {
  if (ouvertes <= 0) return null;
  const part = Math.max(0, Math.min(1, restantes / ouvertes));
  return (
    <span aria-hidden="true" className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-sable">
      <span className="block h-full rounded-full bg-primary" style={{ width: `${part * 100}%` }} />
    </span>
  );
}
