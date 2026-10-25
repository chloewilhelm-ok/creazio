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

export interface VersementArtisan {
  id: string;
  montant_eur: number;
  virement_effectue_le: string;
  reference_virement: string | null;
}

export const tableauDeBordQuery = queryOptions({
  queryKey: ["tableau-de-bord-artisan"],
  queryFn: async () => {
    const [resas, sessions, versements] = await Promise.all([
      supabase.rpc("reservations_artisan"),
      supabase.rpc("sessions_artisan"),
      // RLS : l'artisan ne lit que ses propres versements.
      supabase.from("versements_artisans").select("id,montant_eur,virement_effectue_le,reference_virement").order("virement_effectue_le", { ascending: false }),
    ]);
    if (resas.error) throw toReservationError(resas.error);
    if (sessions.error) throw toReservationError(sessions.error);
    if (versements.error) throw toReservationError(versements.error);
    return {
      reservations: (resas.data ?? []).map((r) => ({ ...r, montant_artisan_eur: Number(r.montant_artisan_eur) })),
      sessions: sessions.data ?? [],
      versements: (versements.data ?? []).map((v) => ({ ...v, montant_eur: Number(v.montant_eur) })) as VersementArtisan[],
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

const arrondi = (n: number) => Math.round(n * 100) / 100;

// ── Bloc « À venir » ────────────────────────────────────────────────────────
/** Réservations et revenus prévus des séances pas encore commencées, remplissage des 4 prochaines semaines. */
export function indicateurs(reservations: ReservationArtisan[], sessions: SessionArtisan[], now = Date.now()) {
  const aVenirListe = reservations.filter((r) => r.statut === "confirmee" && Date.parse(r.debut_le) > now);
  const aVenir = aVenirListe.length;
  const horizon = now + SEMAINES_A_VENIR * 7 * JOUR_MS;
  const futures = sessions.filter((s) => {
    const t = Date.parse(s.debut_le);
    return t > now && t <= horizon && s.places_ouvertes_creazio > 0;
  });
  const proposees = futures.reduce((s, x) => s + x.places_ouvertes_creazio, 0);
  const reservees = futures.reduce((s, x) => s + Math.min(x.places_reservees, x.places_ouvertes_creazio), 0);
  return {
    revenusPrevus: arrondi(aVenirListe.reduce((s, r) => s + r.montant_artisan_eur, 0)),
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

/** 8 semaines passées (dont celle en cours) puis, si demandé, les semaines à venir, par date de la séance. */
export function reservationsParSemaine(reservations: ReservationArtisan[], now = Date.now(), semainesAVenir = SEMAINES_A_VENIR): PointSemaine[] {
  const lundiCourant = lundiDe(now);
  const semaines: PointSemaine[] = [];
  for (let i = -(SEMAINES_PASSEES - 1); i <= semainesAVenir; i++) {
    const lundi = decalerDate(lundiCourant, 7 * i);
    semaines.push({ lundi, libelle: libelleCourt.format(new Date(`${lundi}T12:00:00Z`)), reservations: 0, aVenir: i > 0 });
  }
  const index = new Map(semaines.map((s, i) => [s.lundi, i]));
  for (const r of reservations) {
    if (r.statut !== "confirmee" || (semainesAVenir === 0 && Date.parse(r.debut_le) > now)) continue;
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
  const avecAVenir = points.some((p) => p.aVenir);
  if (total === 0 && aVenir === 0) return avecAVenir ? "Aucune réservation sur les 8 dernières semaines ni sur les 4 à venir." : "Aucune réservation sur les 8 dernières semaines.";
  return `Sur les ${SEMAINES_PASSEES} dernières semaines : ${total} réservation${total > 1 ? "s" : ""}, soit ${
    (Math.round((total / SEMAINES_PASSEES) * 10) / 10).toLocaleString("fr-FR")
  } par semaine en moyenne. Semaine la plus chargée : celle du ${max.libelle} (${max.reservations}).${avecAVenir ? ` Déjà réservé sur les ${SEMAINES_A_VENIR} semaines à venir : ${aVenir}.` : ""}`;
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

// ── Bloc « Passé » : versements mensuels ────────────────────────────────────
// Règle Creazio : un virement par mois, le 15 du mois suivant, pour les réservations confirmées dont la
// séance a eu lieu dans le mois (le délai couvre les 14 jours de signalement d'un litige).

const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 2026-10 » → « 2026-11 ». */
export function moisSuivant(mois: string): string {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}
/** « 2026-10 » → « Octobre 2026 ». */
export function libelleMois(mois: string): string {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  const nom = NOMS_MOIS[m - 1] ?? "";
  return `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${a}`;
}
/** Date de versement prévue d'un mois de séances : le 15 du mois suivant, « 15/11 ». */
export const dateVersementPrevue = (mois: string) => `15/${moisSuivant(mois).slice(5)}`;
/** « 15 novembre » (pour l'indicateur « Prochain versement »). */
export const dateVersementLongue = (mois: string) => `15 ${NOMS_MOIS[Number(moisSuivant(mois).slice(5)) - 1]}`;

const estPassee = (r: ReservationArtisan, now: number) => r.statut === "confirmee" && Date.parse(r.debut_le) <= now;

export interface MoisVersement {
  mois: string;
  libelle: string;
  reservations: number;
  montant: number;
  verse: boolean;
  /** « Versé le 15/09 » ou « À verser le 15/11 ». */
  statut: string;
}

/** Une ligne par mois de séances passées, du plus récent au plus ancien. */
export function versementsParMois(reservations: ReservationArtisan[], versements: VersementArtisan[], now = Date.now()): MoisVersement[] {
  const parMois = new Map<string, { nb: number; montant: number; versees: number }>();
  for (const r of reservations) {
    if (!estPassee(r, now)) continue;
    const mois = enParis(r.debut_le).date.slice(0, 7);
    const g = parMois.get(mois) ?? { nb: 0, montant: 0, versees: 0 };
    g.nb++;
    g.montant += r.montant_artisan_eur;
    if (r.versee) g.versees++;
    parMois.set(mois, g);
  }
  return [...parMois.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mois, g]) => {
      const verse = g.versees === g.nb;
      // Le virement d'un mois est celui effectué le mois suivant (règle du 15).
      const virement = versements.find((v) => enParis(v.virement_effectue_le).date.slice(0, 7) === moisSuivant(mois));
      const jj = virement ? enParis(virement.virement_effectue_le).date : null;
      return {
        mois,
        libelle: libelleMois(mois),
        reservations: g.nb,
        montant: arrondi(g.montant),
        verse,
        statut: verse ? (jj ? `Versé le ${jj.slice(8, 10)}/${jj.slice(5, 7)}` : "Versé") : `À verser le ${dateVersementPrevue(mois)}`,
      };
    });
}

/** Réservations passées pas encore versées : montant et date du prochain virement (15 du mois suivant le plus ancien). */
export function prochainVersement(reservations: ReservationArtisan[], now = Date.now()): { montant: number; date: string; reservations: number } | null {
  const nonVersees = reservations.filter((r) => estPassee(r, now) && !r.versee);
  if (!nonVersees.length) return null;
  const plusAncien = nonVersees.map((r) => enParis(r.debut_le).date.slice(0, 7)).sort()[0]!;
  return {
    montant: arrondi(nonVersees.reduce((s, r) => s + r.montant_artisan_eur, 0)),
    date: dateVersementLongue(plusAncien),
    reservations: nonVersees.length,
  };
}

/** Réservations confirmées dont la séance a commencé, de la plus récente à la plus ancienne. */
export const reservationsPassees = (reservations: ReservationArtisan[], now = Date.now()) =>
  reservations.filter((r) => estPassee(r, now)).sort((a, b) => Date.parse(b.debut_le) - Date.parse(a.debut_le));
