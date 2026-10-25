// Contenu de l'alerte « Atelier à vérifier » envoyée à Creazio (HTML + texte brut), sans dépendance :
// testé par Vitest, utilisé par l'Edge Function alerter-verification-atelier.

export const DESTINATAIRE = "contact@creazio.fr";
export const PROJET_SUPABASE = "fljqrpshvlldtuseoogb";
/** Identifiant de la table public.ateliers dans l'éditeur de tables Supabase ('public.ateliers'::regclass::oid). */
export const ID_TABLE_ATELIERS = 17836;
export const RAPPEL = "Vérifiez le prix puis passez l’atelier en publié.";

export interface DonneesAlerte {
  atelierId: string;
  titre: string;
  artisan: string | null;
  prixPublicEur: number | null;
}

/** Lien vers la ligne de l'atelier dans l'éditeur de tables Supabase. */
export function lienLigneSupabase(atelierId: string): string {
  return `https://supabase.com/dashboard/project/${PROJET_SUPABASE}/editor/${ID_TABLE_ATELIERS}?schema=public&filter=${encodeURIComponent(`id:eq:${atelierId}`)}`;
}

/** « 40 € TTC », ou une alerte si l'artisan n'a pas encore de prix de référence. */
export function libellePrix(prix: number | null): string {
  if (prix == null || !Number.isFinite(prix)) return "Aucun prix (prix de référence de l’artisan non renseigné) : à fixer";
  return `${prix.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} € TTC`;
}

const echapper = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function construireEmailAlerte(d: DonneesAlerte): { sujet: string; html: string; texte: string } {
  const artisan = d.artisan?.trim() || "Artisan inconnu";
  const prix = libellePrix(d.prixPublicEur);
  const lien = lienLigneSupabase(d.atelierId);
  const sujet = `À vérifier : « ${d.titre} » (${artisan})`;
  const ligne = (libelle: string, valeur: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#0F3D3A;font-size:14px;vertical-align:top">${libelle}</td><td style="padding:6px 0;color:#1C1C19;font-size:15px;font-weight:600">${valeur}</td></tr>`;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px">
<tr><td style="padding:24px 28px">
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#8F3222">Nouvel atelier à vérifier</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${ligne("Artisan", echapper(artisan))}
${ligne("Atelier", echapper(d.titre))}
${ligne("Prix appliqué", echapper(prix))}
</table>
<p style="margin:20px 0;font-size:15px;color:#1C1C19"><strong>${echapper(RAPPEL)}</strong></p>
<a href="${echapper(lien)}" style="display:inline-block;background:#8F3222;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">Ouvrir la ligne dans Supabase</a>
</td></tr></table></td></tr></table></body></html>`;
  const texte = [
    "Nouvel atelier à vérifier",
    "",
    `Artisan : ${artisan}`,
    `Atelier : ${d.titre}`,
    `Prix appliqué : ${prix}`,
    "",
    RAPPEL,
    `Ligne dans Supabase : ${lien}`,
  ].join("\n");
  return { sujet, html, texte };
}
