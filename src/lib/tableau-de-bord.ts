import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toReservationError } from "./reservations";

// Données du dashboard artisan (« Mes revenus »), lues par deux fonctions SQL réservées au rôle artisan
// et limitées à ses propres ateliers (reservations_artisan, sessions_artisan).

export interface ReservationArtisan {
  reservation_id: string;
  session_id: string;
  debut_le: string;
  atelier_titre: string;
  prenom: string | null;
  code_creazio: string;
  credits_debites: number;
  montant_artisan_eur: number;
  statut: string;
  versee: boolean;
  reservee_le: string;
}

export interface SessionArtisan {
  session_id: string;
  atelier_titre: string;
  debut_le: string;
  places_ouvertes_creazio: number;
  places_reservees: number;
}

export const SEMAINES_PASSEES = 8;
export const SEMAINES_A_VENIR = 4;
export const SEUIL_CREUX = 0.5;
const JOUR_MS = 86_400_000;

export const tableauDeBordQuery = queryOptions({
  queryKey: ["tableau-de-bord-artisan"],
  queryFn: async () => {
    const [resas, sessions] = await Promise.all([
      supabase.rpc("reservations_artisan"),
      supabase.rpc("sessions_artisan"),
    ]);
    if (resas.error) throw toReservationError(resas.error);
    if (sessions.error) throw toReservationError(sessions.error);
    return {
      reservations: (resas.data ?? []).map((r) => ({ ...r, montant_artisan_eur: Number(r.montant_artisan_eur) })),
      sessions: sessions.data ?? [],
    };
  },
});

/** Message affiché sur le dashboard (les codes viennent des fonctions SQL). */
export function messageTableauDeBord(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "ROLE_INTERDIT") return "Ce tableau de bord est réservé aux comptes artisans.";
  if (code === "NON_CONNECTE") return "Votre session a expiré. Reconnectez-vous pour voir vos revenus.";
  return "Impossible de charger vos revenus pour le moment. Vérifiez votre connexion et réessayez.";
}

// ── Dates à l'heure de Paris ────────────────────────────────────────────────
const partiesParis = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const NUM_JOUR: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Jour de la semaine (1 = lundi), date (AAAA-MM-JJ) et heure (HH:MM) d'un instant, à Paris. */
export function enParis(iso: string | number) {
  const p: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = Object.fromEntries(
    partiesParis.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return { jour: NUM_JOUR[p.weekday ?? "Mon"] ?? 1, date: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` };
}

/** Lundi (AAAA-MM-JJ) de la semaine parisienne qui contient cet instant. */
export function lundiDe(iso: string | number): string {
  const { jour, date } = enParis(iso);
  return decalerDate(date, -(jour - 1));
}
const decalerDate = (date: string, jours: number) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + jours * JOUR_MS).toISOString().slice(0, 10);

const libelleCourt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const formatEuros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
export const formatPourcent = (taux: number) => `${Math.round(taux * 100)} %`;

// ── Indicateurs clés ────────────────────────────────────────────────────────
export function indicateurs(reservations: ReservationArtisan[], sessions: SessionArtisan[], now = Date.now()) {
  const confirmees = reservations.filter((r) => r.statut === "confirmee");
  const aReverser = confirmees.filter((r) => !r.versee).reduce((s, r) => s + r.montant_artisan_eur, 0);
  const aVenir = confirmees.filter((r) => Date.parse(r.debut_le) > now).length;
  const horizon = now + SEMAINES_A_VENIR * 7 * JOUR_MS;
  const futures = sessions.filter((s) => {
    const t = Date.parse(s.debut_le);
    return t > now && t <= horizon && s.places_ouvertes_creazio > 0;
  });
  const proposees = futures.reduce((s, x) => s + x.places_ouvertes_creazio, 0);
  const reservees = futures.reduce((s, x) => s + Math.min(x.places_reservees, x.places_ouvertes_creazio), 0);
  return {
    montantAReverser: Math.round(aReverser * 100) / 100,
    reservationsAVenir: aVenir,
    tauxRemplissageAVenir: proposees ? reservees / proposees : null,
    creneauxAVenir: futures.length,
  };
}

// ── Réservations par semaine ────────────────────────────────────────────────
export interface PointSemaine {
  lundi: string;
  libelle: string;
  reservations: number;
  aVenir: boolean;
}

/** 8 semaines passées (dont celle en cours) puis 4 à venir, par date de la séance. */
export function reservationsParSemaine(reservations: ReservationArtisan[], now = Date.now()): PointSemaine[] {
  const lundiCourant = lundiDe(now);
  const semaines: PointSemaine[] = [];
  for (let i = -(SEMAINES_PASSEES - 1); i <= SEMAINES_A_VENIR; i++) {
    const lundi = decalerDate(lundiCourant, 7 * i);
    semaines.push({ lundi, libelle: libelleCourt.format(new Date(`${lundi}T12:00:00Z`)), reservations: 0, aVenir: i > 0 });
  }
  const index = new Map(semaines.map((s, i) => [s.lundi, i]));
  for (const r of reservations) {
    if (r.statut !== "confirmee") continue;
    const i = index.get(lundiDe(r.debut_le));
    if (i !== undefined) semaines[i]!.reservations++;
  }
  return semaines;
}

export function resumeSemaines(points: PointSemaine[]): string {
  const passees = points.filter((p) => !p.aVenir);
  const total = passees.reduce((s, p) => s + p.reservations, 0);
  const max = passees.reduce((m, p) => (p.reservations > m.reservations ? p : m), passees[0] ?? points[0]!);
  const aVenir = points.filter((p) => p.aVenir).reduce((s, p) => s + p.reservations, 0);
  if (total === 0 && aVenir === 0) return "Aucune réservation sur les 8 dernières semaines ni sur les 4 à venir.";
  return `Sur les ${SEMAINES_PASSEES} dernières semaines : ${total} réservation${total > 1 ? "s" : ""}, soit ${
    (Math.round((total / SEMAINES_PASSEES) * 10) / 10).toLocaleString("fr-FR")
  } par semaine en moyenne. Semaine la plus chargée : celle du ${max.libelle} (${max.reservations}). Déjà réservé sur les ${SEMAINES_A_VENIR} semaines à venir : ${aVenir}.`;
}

// ── Remplissage par créneau ─────────────────────────────────────────────────
export interface PointCreneau {
  cle: string;
  libelle: string;
  jour: number;
  heure: string;
  taux: number;
  reservees: number;
  proposees: number;
  seances: number;
  creux: boolean;
}

/** Taux de remplissage des places Creazio par jour de la semaine et horaire (toutes les séances de la période). */
export function remplissageParCreneau(sessions: SessionArtisan[]): PointCreneau[] {
  const groupes = new Map<string, PointCreneau>();
  for (const s of sessions) {
    if (s.places_ouvertes_creazio <= 0) continue;
    const { jour, heure } = enParis(s.debut_le);
    const cle = `${jour}-${heure}`;
    const g = groupes.get(cle) ?? {
      cle, jour, heure, libelle: `${JOURS[jour]} ${heure.replace(":", "h")}`,
      taux: 0, reservees: 0, proposees: 0, seances: 0, creux: false,
    };
    g.reservees += Math.min(s.places_reservees, s.places_ouvertes_creazio);
    g.proposees += s.places_ouvertes_creazio;
    g.seances++;
    groupes.set(cle, g);
  }
  return [...groupes.values()]
    .map((g) => ({ ...g, taux: g.reservees / g.proposees, creux: g.reservees / g.proposees < SEUIL_CREUX }))
    .sort((a, b) => a.jour - b.jour || a.heure.localeCompare(b.heure));
}

export function resumeCreneaux(points: PointCreneau[]): string {
  if (!points.length) return "Aucun créneau sur la période.";
  const meilleur = points.reduce((m, p) => (p.taux > m.taux ? p : m));
  const creux = points.filter((p) => p.creux);
  return `Créneau le plus rempli : ${meilleur.libelle} (${formatPourcent(meilleur.taux)}). ${
    creux.length
      ? `Créneau${creux.length > 1 ? "x" : ""} creux, à moins de 50 % : ${creux.map((p) => `${p.libelle} (${formatPourcent(p.taux)})`).join(", ")}.`
      : "Aucun créneau creux : tous sont remplis à 50 % ou plus."
  }`;
}
