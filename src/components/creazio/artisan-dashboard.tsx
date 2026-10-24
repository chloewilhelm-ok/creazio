import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Euro, Percent, Radio, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatHeure, formatJour } from "@/lib/reservations";
import {
  SEMAINES_A_VENIR,
  formatEuros,
  formatPourcent,
  indicateurs,
  messageTableauDeBord,
  remplissageParCreneau,
  reservationsParSemaine,
  resumeCreneaux,
  resumeSemaines,
  tableauDeBordQuery,
  type PointCreneau,
  type PointSemaine,
  type ReservationArtisan,
} from "@/lib/tableau-de-bord";

// Couleurs du design system (docs/design-system.md) : une seule couleur par graphique (secondary),
// le terracotta (primary) réservé à la mise en évidence des créneaux creux, toujours doublée d'un libellé.
const C = { barre: "#3B6662", creux: "#8F3222", grille: "#E5E2DD", axe: "#56423E" };
const PAR_PAGE = 15;

/** Abonnement Realtime : toute réservation (ou annulation) visible par l'artisan recharge le dashboard. */
function useTempsReel() {
  const queryClient = useQueryClient();
  const [enDirect, setEnDirect] = useState(false);
  const [annonce, setAnnonce] = useState("");
  useEffect(() => {
    const canal = supabase
      .channel("tableau-de-bord-artisan")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, (payload) => {
        void queryClient.invalidateQueries({ queryKey: tableauDeBordQuery.queryKey });
        setAnnonce(payload.eventType === "INSERT" ? "Nouvelle réservation reçue." : "Une réservation a été mise à jour.");
      })
      .subscribe((statut) => setEnDirect(statut === "SUBSCRIBED"));
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [queryClient]);
  return { enDirect, annonce };
}

export function ArtisanDashboard() {
  const { data, isPending, error, refetch, isFetching } = useQuery(tableauDeBordQuery);
  const { enDirect, annonce } = useTempsReel();
  const calculs = useMemo(() => {
    if (!data) return null;
    const semaines = reservationsParSemaine(data.reservations);
    const creneaux = remplissageParCreneau(data.sessions);
    return { kpi: indicateurs(data.reservations, data.sessions), semaines, creneaux };
  }, [data]);

  return (
    <div className="grid gap-6">
      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <Radio className={enDirect ? "size-4 text-secondary" : "size-4"} aria-hidden="true" />
        {enDirect ? "Mise à jour en temps réel" : "Connexion au temps réel…"}
        {annonce && <span className="sr-only">{annonce}</span>}
      </p>
      {isPending ? (
        <p role="status" className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Chargement de vos revenus…
        </p>
      ) : error || !calculs || !data ? (
        <div role="alert" className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm">{messageTableauDeBord(error)}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw aria-hidden="true" /> Réessayer
          </Button>
        </div>
      ) : (
        <>
          <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-3">
            <Indicateur icon={<Euro />} libelle="Montant à reverser" valeur={formatEuros(calculs.kpi.montantAReverser)} detail="Réservations confirmées pas encore versées" />
            <Indicateur icon={<CalendarDays />} libelle="Réservations à venir" valeur={String(calculs.kpi.reservationsAVenir)} detail="Séances qui n’ont pas encore eu lieu" />
            <Indicateur
              icon={<Percent />}
              libelle="Remplissage moyen à venir"
              valeur={calculs.kpi.tauxRemplissageAVenir === null ? "—" : formatPourcent(calculs.kpi.tauxRemplissageAVenir)}
              detail={`Places Creazio réservées sur les ${SEMAINES_A_VENIR} prochaines semaines (${calculs.kpi.creneauxAVenir} créneaux)`}
            />
          </section>
          <div className="grid gap-6 xl:grid-cols-2">
            <GraphiqueSemaines points={calculs.semaines} />
            <GraphiqueCreneaux points={calculs.creneaux} />
          </div>
          <ListeReservations reservations={data.reservations} />
        </>
      )}
    </div>
  );
}

function Indicateur({ icon, libelle, valeur, detail }: { icon: ReactNode; libelle: string; valeur: string; detail: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <span className="text-primary [&_svg]:size-5" aria-hidden="true">{icon}</span>
      <p className="mt-4 text-sm text-muted-foreground">{libelle}</p>
      <strong className="label-font text-2xl text-foreground">{valeur}</strong>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Carte({ id, titre, resume, children, table, legende }: { id: string; titre: string; resume: string; children: ReactNode; table: ReactNode; legende?: ReactNode }) {
  return (
    <figure aria-labelledby={`${id}-titre`} aria-describedby={`${id}-resume`} className="m-0 rounded-2xl border bg-card p-5">
      <h2 id={`${id}-titre`} className="text-lg font-semibold">{titre}</h2>
      <p id={`${id}-resume`} className="mt-1 text-sm text-muted-foreground">{resume}</p>
      <div className="mt-4 h-64">{children}</div>
      {legende}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">Voir les données en tableau</summary>
        <div className="mt-2 max-h-60 overflow-auto">{table}</div>
      </details>
    </figure>
  );
}

function InfoBulle({ active, payload, rendu }: { active?: boolean; payload?: { payload: unknown }[]; rendu: (p: never) => ReactNode }) {
  if (!active || !payload?.[0]) return null;
  return <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">{rendu(payload[0].payload as never)}</div>;
}

function GraphiqueSemaines({ points }: { points: PointSemaine[] }) {
  return (
    <Carte
      id="graphique-semaines"
      titre="Réservations par semaine"
      resume={resumeSemaines(points)}
      legende={
        <p className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm" style={{ background: C.barre }} />Semaines passées et en cours</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm border" style={{ borderColor: C.barre, background: `repeating-linear-gradient(45deg, ${C.barre} 0 2px, #fff 2px 5px)` }} />À venir (déjà réservé)</span>
      </p>
      }
      table={
        <table className="w-full text-left">
          <thead><tr><th className="py-1">Semaine du</th><th>Réservations</th><th>Période</th></tr></thead>
          <tbody>{points.map((p) => <tr key={p.lundi} className="border-t"><td className="py-1">{p.libelle}</td><td>{p.reservations}</td><td>{p.aVenir ? "À venir" : "Passée ou en cours"}</td></tr>)}</tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} accessibilityLayer>
          <defs>
            <pattern id="hachures-a-venir" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#FFFFFF" />
              <line x1="0" y1="0" x2="0" y2="6" stroke={C.barre} strokeWidth="3" />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke={C.grille} />
          <XAxis dataKey="libelle" tick={{ fill: C.axe, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.grille }} interval={0} angle={-35} textAnchor="end" height={44} />
          <YAxis allowDecimals={false} tick={{ fill: C.axe, fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "#F2E6D6" }} content={<InfoBulle rendu={(p: PointSemaine) => <><strong>{p.reservations} réservation{p.reservations > 1 ? "s" : ""}</strong><br />Semaine du {p.libelle}{p.aVenir ? " (à venir)" : ""}</>} />} />
          <Bar dataKey="reservations" name="Réservations" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {points.map((p) => <Cell key={p.lundi} fill={p.aVenir ? "url(#hachures-a-venir)" : C.barre} stroke={C.barre} strokeWidth={p.aVenir ? 1 : 0} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Carte>
  );
}

function GraphiqueCreneaux({ points }: { points: PointCreneau[] }) {
  const meilleur = points.reduce<PointCreneau | null>((m, p) => (!m || p.taux > m.taux ? p : m), null);
  return (
    <Carte
      id="graphique-creneaux"
      titre="Remplissage par créneau"
      resume={resumeCreneaux(points)}
      table={
        <table className="w-full text-left">
          <thead><tr><th className="py-1">Créneau</th><th>Remplissage</th><th>Places réservées</th><th>Séances</th></tr></thead>
          <tbody>{points.map((p) => <tr key={p.cle} className="border-t"><td className="py-1">{p.libelle}</td><td>{formatPourcent(p.taux)}{p.creux ? " (creux)" : ""}</td><td>{p.reservees} / {p.proposees}</td><td>{p.seances}</td></tr>)}</tbody>
        </table>
      }
    >
      {points.length === 0 ? (
        <p className="grid h-full place-items-center text-sm text-muted-foreground">Aucun créneau sur la période.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 8 }} accessibilityLayer>
            <CartesianGrid horizontal={false} stroke={C.grille} />
            <XAxis type="number" domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={(v: number) => formatPourcent(v)} tick={{ fill: C.axe, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="libelle" width={112} tick={{ fill: C.axe, fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "#F2E6D6" }} content={<InfoBulle rendu={(p: PointCreneau) => <><strong>{formatPourcent(p.taux)}</strong> {p.creux ? "· creux" : ""}<br />{p.libelle} : {p.reservees} places réservées sur {p.proposees} ({p.seances} séances)</>} />} />
            <Bar dataKey="taux" name="Remplissage" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              {points.map((p) => <Cell key={p.cle} fill={p.creux ? C.creux : C.barre} />)}
              <LabelList
                dataKey="taux"
                position="right"
                content={(props) => {
                  const { x, y, width, height, index } = props as { x: number; y: number; width: number; height: number; index: number };
                  const p = points[index];
                  if (!p || (!p.creux && p !== meilleur)) return null;
                  return <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={12} fontWeight={600} fill="#1C1C19">{p.creux ? `Creux · ${formatPourcent(p.taux)}` : formatPourcent(p.taux)}</text>;
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Carte>
  );
}

function ListeReservations({ reservations }: { reservations: ReservationArtisan[] }) {
  const [nombre, setNombre] = useState(PAR_PAGE);
  const visibles = reservations.slice(0, nombre);
  return (
    <section aria-labelledby="liste-reservations-titre" className="rounded-2xl border bg-card p-5">
      <h2 id="liste-reservations-titre" className="text-lg font-semibold">Réservations</h2>
      <p className="mt-1 text-sm text-muted-foreground">Virement effectué manuellement par Creazio après 14 jours.</p>
      {reservations.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr><th className="py-2 font-semibold">Date</th><th className="font-semibold">Atelier</th><th className="font-semibold">Élève</th><th className="font-semibold">Code</th><th className="text-right font-semibold">Crédits</th><th className="text-right font-semibold">Montant reçu</th><th className="pl-4 font-semibold">Statut</th></tr>
              </thead>
              <tbody>
                {visibles.map((r) => {
                  const annulee = r.statut !== "confirmee";
                  return (
                    <tr key={r.reservation_id} className="border-t">
                      <td className="py-2.5">{formatJour(r.debut_le)} · {formatHeure(r.debut_le)}</td>
                      <td>{r.atelier_titre}</td>
                      <td>{r.prenom ?? <span className="text-muted-foreground">Anonyme</span>}</td>
                      <td className="label-font">{r.code_creazio}</td>
                      <td className="text-right">{r.credits_debites}</td>
                      <td className="text-right">{annulee ? "—" : formatEuros(r.montant_artisan_eur)}</td>
                      <td className="pl-4">{annulee ? "Annulée" : r.versee ? "Versé" : "À verser"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {nombre < reservations.length && (
            <Button variant="outline" className="mt-4" onClick={() => setNombre((n) => n + PAR_PAGE)}>
              Afficher plus ({reservations.length - nombre} restantes)
            </Button>
          )}
        </>
      )}
    </section>
  );
}
