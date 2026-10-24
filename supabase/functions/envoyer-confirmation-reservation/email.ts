// Contenu de l'email « Votre atelier est réservé » (HTML + texte brut), sans dépendance :
// testé par Vitest (src/test/creazio-email-reservation.test.ts) et utilisé par l'Edge Function.

export interface DonneesConfirmation {
  prenom: string;
  atelier: string;
  artisan: string | null;
  debutLe: string;
  finLe: string;
  adresse: string;
  creditsDebites: number;
  codeCreazio: string;
  delaiAnnulationHeures: number;
}

export const LIEN_RESERVATIONS = "https://www.creazio.fr/espace-eleve/reservations";

// Couleurs du design system (docs/design-system.md).
const C = {
  primaire: "#8F3222",
  foret: "#0F3D3A",
  sable: "#F2E6D6",
  fond: "#FFFEFD",
  texte: "#1C1C19",
  secondaire: "#56423E",
};

const jour = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const heure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateSession(debutLe: string, finLe: string): string {
  const j = jour.format(new Date(debutLe));
  return `${j.charAt(0).toUpperCase()}${j.slice(1)}, de ${heure.format(new Date(debutLe))} à ${heure.format(new Date(finLe))}`;
}

const creditsDebites = (n: number) => (n > 1 ? `${n} crédits débités` : `${n} crédit débité`);

/** Échappe les données saisies par les utilisateurs (prénom, titre…) avant de les placer dans le HTML. */
export function echapper(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export function construireEmailConfirmation(d: DonneesConfirmation): {
  sujet: string;
  html: string;
  texte: string;
} {
  const quand = formatDateSession(d.debutLe, d.finLe);
  const rappel = `Annulation gratuite jusqu’à ${d.delaiAnnulationHeures} h avant, depuis Mes réservations.`;
  const sujet = `Votre atelier est réservé : ${d.atelier}`;
  const bonjour = d.prenom.trim() ? `Bonjour ${d.prenom.trim()},` : "Bonjour,";
  const ligne = (libelle: string, valeur: string) =>
    `<tr><td style="padding:6px 0;color:${C.secondaire};font-size:14px;width:120px;vertical-align:top">${libelle}</td><td style="padding:6px 0;color:${C.texte};font-size:15px;font-weight:600">${valeur}</td></tr>`;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(sujet)}</title></head>
<body style="margin:0;padding:0;background:${C.sable};font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sable};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.fond};border-radius:16px;overflow:hidden">
<tr><td style="padding:24px 28px;border-bottom:1px solid ${C.sable}"><span style="font-size:24px;font-weight:700;color:${C.primaire}">Creazio</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:${C.foret}">Votre atelier est réservé</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:${C.texte}">${echapper(bonjour)}<br>votre place est confirmée. Voici le récapitulatif de votre réservation.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${ligne("Atelier", echapper(d.atelier))}
${d.artisan ? ligne("Artisan", echapper(d.artisan)) : ""}
${ligne("Date", echapper(quand))}
${ligne("Adresse", echapper(d.adresse))}
${ligne("Crédits", creditsDebites(d.creditsDebites))}
</table>
<div style="margin:24px 0;padding:20px;border-radius:12px;background:${C.sable};text-align:center">
<p style="margin:0 0 6px;font-size:14px;color:${C.secondaire}">Votre code Creazio, à présenter à l’artisan</p>
<p style="margin:0;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:4px;color:${C.primaire}">${echapper(d.codeCreazio)}</p>
</div>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:${C.texte}">${echapper(rappel)} Pensez à arriver 10 minutes avant le début.</p>
<a href="${LIEN_RESERVATIONS}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${C.primaire};color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none">Voir mes réservations</a>
</td></tr>
<tr><td style="padding:18px 28px;background:${C.foret};color:#FFFFFF;font-size:12px;line-height:1.5">Creazio · L’atelier créatif près de chez vous, à prix doux.<br>Vous recevez cet email car vous avez réservé un atelier sur creazio.fr.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const texte = [
    "Votre atelier est réservé",
    "",
    bonjour,
    "votre place est confirmée. Voici le récapitulatif de votre réservation.",
    "",
    `Atelier : ${d.atelier}`,
    ...(d.artisan ? [`Artisan : ${d.artisan}`] : []),
    `Date : ${quand}`,
    `Adresse : ${d.adresse}`,
    `Crédits : ${creditsDebites(d.creditsDebites)}`,
    "",
    `Votre code Creazio : ${d.codeCreazio}`,
    "",
    rappel,
    `Mes réservations : ${LIEN_RESERVATIONS}`,
  ].join("\n");

  return { sujet, html, texte };
}
