import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DELAI_ANNULATION_DEFAUT_HEURES = 48;

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});
export const formatJour = (iso: string) => {
  const j = dateFormat.format(new Date(iso));
  return j.charAt(0).toUpperCase() + j.slice(1);
};
export const formatHeure = (iso: string) => timeFormat.format(new Date(iso));
export const formatCredits = (n: number) => `${n} ${n > 1 ? "crédits" : "crédit"}`;

/** Messages affichés à l'élève pour chaque code métier renvoyé par les fonctions SQL. */
const MESSAGES_ERREUR: Record<string, string> = {
  SOLDE_INSUFFISANT: "Votre solde de crédits ne suffit pas pour ce créneau.",
  COMPLET: "Ce créneau vient d’être complet. Choisissez-en un autre.",
  DEJA_RESERVE: "Vous avez déjà réservé ce créneau. Retrouvez-le dans « Mes réservations ».",
  SESSION_PASSEE: "Ce créneau est déjà passé. Choisissez-en un autre.",
  SESSION_FERMEE: "Ce créneau n’est plus ouvert à la réservation.",
  SESSION_INTROUVABLE: "Ce créneau n’est plus proposé.",
  PRIX_INDISPONIBLE: "Ce créneau n’est pas encore réservable : son prix n’est pas fixé.",
  DELAI_DEPASSE:
    "L’annulation gratuite n’est plus possible : l’atelier commence dans moins de 48 h.",
  RESERVATION_NON_ANNULABLE: "Cette réservation est déjà annulée.",
  RESERVATION_INTROUVABLE: "Cette réservation est introuvable.",
  NON_CONNECTE: "Votre session a expiré. Reconnectez-vous pour continuer.",
  ROLE_INTERDIT: "Cette action est réservée aux comptes élèves.",
};
const MESSAGE_PAR_DEFAUT = "Une erreur est survenue. Vérifiez votre connexion et réessayez.";

export class ReservationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Traduit une erreur Supabase en message lisible ; le message technique n'est jamais montré. */
export function toReservationError(
  error: { message?: string } | null | undefined,
): ReservationError {
  const code = /^([A-Z_]+):/.exec(error?.message ?? "")?.[1] ?? "INCONNUE";
  return new ReservationError(code, MESSAGES_ERREUR[code] ?? MESSAGE_PAR_DEFAUT);
}

export function messageErreur(error: unknown): string {
  return error instanceof ReservationError ? error.message : MESSAGE_PAR_DEFAUT;
}

/** Annulation gratuite possible tant que la session commence dans plus de `delaiHeures`. */
export function peutAnnuler(
  debutLe: string,
  delaiHeures: number,
  now: number = Date.now(),
): boolean {
  return Date.parse(debutLe) - now > delaiHeures * 3_600_000;
}

export const walletQuery = queryOptions({
  queryKey: ["portefeuille"],
  queryFn: async (): Promise<{ solde_credits: number } | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("portefeuilles")
      .select("solde_credits")
      .eq("eleve_id", user.id)
      .maybeSingle();
    if (error) throw toReservationError(error);
    return data ?? { solde_credits: 0 };
  },
});

export const delaiAnnulationQuery = queryOptions({
  queryKey: ["parametres_plateforme", "delai_annulation"],
  queryFn: async () => {
    const { data } = await supabase
      .from("parametres_plateforme")
      .select("delai_annulation_gratuite_heures")
      .maybeSingle();
    return data?.delai_annulation_gratuite_heures ?? DELAI_ANNULATION_DEFAUT_HEURES;
  },
  staleTime: Infinity,
});

const RESERVATION_SELECT =
  "id,code_creazio,credits_debites,statut,sessions(debut_le,fin_le,ateliers(id,titre,adresse_ligne,code_postal,ville,artisans(nom_commercial)))";

export const reservationQuery = (id: string) =>
  queryOptions({
    queryKey: ["reservations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(RESERVATION_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw toReservationError(error);
      return data;
    },
  });

/** Réservations confirmées de l'élève connecté dont la session n'a pas commencé, de la plus proche à la plus lointaine. */
async function fetchUpcomingReservations() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("reservations")
    .select(RESERVATION_SELECT)
    .eq("eleve_id", user.id)
    .eq("statut", "confirmee");
  if (error) throw toReservationError(error);
  const now = Date.now();
  return (data ?? [])
    .flatMap((r) =>
      r.sessions && Date.parse(r.sessions.debut_le) > now ? [{ ...r, sessions: r.sessions }] : [],
    )
    .sort((a, b) => Date.parse(a.sessions.debut_le) - Date.parse(b.sessions.debut_le));
}
export type UpcomingReservation = Awaited<ReturnType<typeof fetchUpcomingReservations>>[number];

/** Réservations confirmées de l'élève connecté dont la session n'a pas commencé, de la plus proche à la plus lointaine. */
export const upcomingReservationsQuery = queryOptions({
  queryKey: ["reservations", "a-venir"],
  queryFn: fetchUpcomingReservations,
});

export async function reserverSession(sessionId: string) {
  const { data, error } = await supabase.rpc("reserver_session", { p_session_id: sessionId });
  if (error) throw toReservationError(error);
  const row = data?.[0];
  if (!row) throw toReservationError(null);
  return row;
}

export async function annulerReservation(reservationId: string) {
  const { data, error } = await supabase.rpc("annuler_reservation", {
    p_reservation_id: reservationId,
  });
  if (error) throw toReservationError(error);
  return data;
}
