// Contenu de l'alerte « Nouvelle candidature artisan » envoyée à Creazio (HTML + texte brut), sans dépendance :
// testé par Vitest, utilisé par l'Edge Function alerter-nouvelle-candidature.

export const DESTINATAIRE = "contact@creazio.fr";
export const PROJET_SUPABASE = "fljqrpshvlldtuseoogb";
/** Identifiant de la table public.artisans dans l'éditeur de tables Supabase ('public.artisans'::regclass::oid). */
export const ID_TABLE_ARTISANS = 17768;
export const MARCHE_A_SUIVRE = [
  "Ouvrez Supabase → Table Editor → artisans (lien ci-dessous).",
  "Vérifiez la candidature (atelier, savoir-faire, adresse).",
  "Passez statut_candidature à « validee » : l'artisan accède alors à son espace.",
];

const LIBELLES: Record<string, string> = {
  poterie_ceramique: "Poterie et céramique", textile: "Textile", bois: "Bois", vegetal: "Végétal", papier: "Papier",
  cosmetique_bien_etre: "Cosmétique et bien-être", bijouterie: "Bijouterie", metal: "Métal", cuir: "Cuir",
  verre: "Verre", a_manger: "À manger", a_boire: "À boire",
};

export interface DonneesCandidature {
  profileId: string;
  nomAtelier: string;
  prenom: string | null;
  savoirFaire: string;
  ville: string;
  creeLe: string;
}

export function lienCandidature(profileId: string): string {
  return `https://supabase.com/dashboard/project/${PROJET_SUPABASE}/editor/${ID_TABLE_ARTISANS}?schema=public&filter=${encodeURIComponent(`profile_id:eq:${profileId}`)}`;
}

const dateParis = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });
const echapper = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function construireEmailCandidature(d: DonneesCandidature): { sujet: string; html: string; texte: string } {
  const prenom = d.prenom?.trim() || "Prénom non renseigné";
  const savoirFaire = LIBELLES[d.savoirFaire] ?? d.savoirFaire;
  const quand = dateParis.format(new Date(d.creeLe));
  const lien = lienCandidature(d.profileId);
  const sujet = `Nouvelle candidature artisan : ${d.nomAtelier} (${d.ville})`;
  const ligne = (libelle: string, valeur: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#0F3D3A;font-size:14px;vertical-align:top">${libelle}</td><td style="padding:6px 0;color:#1C1C19;font-size:15px;font-weight:600">${valeur}</td></tr>`;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px">
<tr><td style="padding:24px 28px">
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#8F3222">Nouvelle candidature artisan</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${ligne("Atelier", echapper(d.nomAtelier))}
${ligne("Prénom", echapper(prenom))}
${ligne("Savoir-faire", echapper(savoirFaire))}
${ligne("Ville", echapper(d.ville))}
${ligne("Date", echapper(quand))}
</table>
<p style="margin:20px 0 8px;font-size:15px;font-weight:700;color:#1C1C19">Pour valider la candidature</p>
<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.6;color:#1C1C19">${MARCHE_A_SUIVRE.map((e) => `<li>${echapper(e)}</li>`).join("")}</ol>
<a href="${echapper(lien)}" style="display:inline-block;background:#8F3222;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">Ouvrir la candidature dans Supabase</a>
</td></tr></table></td></tr></table></body></html>`;
  const texte = [
    "Nouvelle candidature artisan",
    "",
    `Atelier : ${d.nomAtelier}`,
    `Prénom : ${prenom}`,
    `Savoir-faire : ${savoirFaire}`,
    `Ville : ${d.ville}`,
    `Date : ${quand}`,
    "",
    "Pour valider la candidature :",
    ...MARCHE_A_SUIVRE.map((e, i) => `${i + 1}. ${e}`),
    `Candidature dans Supabase : ${lien}`,
  ].join("\n");
  return { sujet, html, texte };
}
