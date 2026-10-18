import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workshopSessionsQuery } from "@/lib/workshop-sessions";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

export function WorkshopSlots({ workshopId }: { workshopId: string }) {
  const { data, isPending, error, refetch } = useQuery(workshopSessionsQuery(workshopId));
  return <section className="mt-6" aria-label="Créneaux disponibles">
    <h2 className="font-semibold">Créneaux disponibles</h2>
    {isPending ? <p role="status" className="mt-3 text-sm text-muted-foreground">Chargement des créneaux…</p>
      : error ? <div className="mt-3"><p role="alert" className="text-sm text-muted-foreground">Impossible de charger les créneaux.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Réessayer</Button></div>
      : !data?.length ? <p className="mt-3 text-sm text-muted-foreground">Aucun créneau disponible pour le moment.</p>
      : <ul className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">{data.map(slot => <li key={slot.id} className="rounded-lg border p-4">
        <p className="flex items-start gap-2 text-sm font-semibold"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary"/>{dateFormat.format(new Date(slot.debut_le))}</p>
        <p className="mt-2 text-sm">{timeFormat.format(new Date(slot.debut_le))} – {timeFormat.format(new Date(slot.fin_le))}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="flex items-center gap-1 text-muted-foreground"><Users className="size-4"/>{slot.places_restantes} {slot.places_restantes === 1 ? "place disponible" : "places disponibles"}</span><strong className="text-primary">{slot.prix_credits} crédits</strong></div>
      </li>)}</ul>}
  </section>;
}