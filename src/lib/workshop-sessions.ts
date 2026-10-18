import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Session = Database["public"]["Tables"]["sessions"]["Row"];
export function availableSessions<T extends Pick<Session, "debut_le" | "statut" | "places_restantes">>(sessions: T[], now: number = Date.now()): T[] {
  return sessions.filter(s => s.statut === "ouverte" && s.places_restantes > 0 && Date.parse(s.debut_le) > now)
    .sort((a, b) => Date.parse(a.debut_le) - Date.parse(b.debut_le));
}

export const workshopSessionsQuery = (workshopId: string) => queryOptions({
  queryKey: ["ateliers", workshopId, "sessions-disponibles"],
  queryFn: async () => {
    const now = Date.now();
    const { data, error } = await supabase.from("sessions")
      .select("id,debut_le,fin_le,statut,places_restantes,prix_credits")
      .eq("atelier_id", workshopId).eq("statut", "ouverte")
      .gt("places_restantes", 0).gt("debut_le", new Date(now).toISOString())
      .order("debut_le", { ascending: true });
    if (error) throw error;
    return availableSessions(data ?? [], now);
  },
});