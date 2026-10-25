import type { ReactNode } from "react";
import { Footer, PublicHeader } from "./pages";

// Affiche un texte légal écrit en Markdown (docs/legal/*.md) avec le design system, sans dépendance :
// titres, paragraphes, listes, tableaux, gras, italique et liens (http et email). Le texte reste identique.

/** Gras, italique, liens [texte](url) et adresses email. */
function enLigne(texte: string, cle: string): ReactNode[] {
  const motif = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,})/g;
  return texte.split(motif).filter(Boolean).map((morceau, i) => {
    const k = `${cle}-${i}`;
    if (morceau.startsWith("**")) return <strong key={k} className="font-semibold text-foreground">{morceau.slice(2, -2)}</strong>;
    if (morceau.startsWith("*") && morceau.endsWith("*")) return <em key={k}>{morceau.slice(1, -1)}</em>;
    const lien = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(morceau);
    if (lien) return <a key={k} href={lien[2]} className="font-semibold text-primary underline underline-offset-4">{lien[1]}</a>;
    if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}$/.test(morceau)) return <a key={k} href={`mailto:${morceau}`} className="font-semibold text-primary underline underline-offset-4">{morceau}</a>;
    return morceau;
  });
}

const cellules = (ligne: string) => ligne.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function rendreMarkdown(md: string): ReactNode[] {
  const lignes = md.replace(/\r/g, "").split("\n");
  const blocs: ReactNode[] = [];
  let i = 0;
  while (i < lignes.length) {
    const ligne = lignes[i]!;
    const k = `b${i}`;
    if (!ligne.trim()) { i++; continue; }
    const titre = /^(#{1,3})\s+(.*)$/.exec(ligne);
    if (titre) {
      const niveau = titre[1]!.length;
      const contenu = enLigne(titre[2]!, k);
      blocs.push(niveau === 1
        ? <h1 key={k} className="text-3xl font-bold leading-tight text-secondary md:text-4xl">{contenu}</h1>
        : niveau === 2
          ? <h2 key={k} className="mt-10 text-xl font-bold text-secondary">{contenu}</h2>
          : <h3 key={k} className="mt-6 text-lg font-semibold">{contenu}</h3>);
      i++; continue;
    }
    if (ligne.trim().startsWith("|")) {
      const tableau: string[] = [];
      while (i < lignes.length && lignes[i]!.trim().startsWith("|")) tableau.push(lignes[i++]!);
      const [entete, , ...corps] = tableau;
      blocs.push(
        <div key={k} className="mt-4 overflow-x-auto rounded-xl border border-deep-forest/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-sable/60">
              <tr>{cellules(entete ?? "").map((c, j) => <th key={j} scope="col" className="px-4 py-3 font-semibold text-secondary">{enLigne(c, `${k}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>{corps.map((l, r) => <tr key={r} className="border-t border-deep-forest/10 align-top">{cellules(l).map((c, j) => <td key={j} className="px-4 py-3">{enLigne(c, `${k}${r}${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(ligne) || /^\s*\d+\.\s+/.test(ligne)) {
      const ordonnee = /^\s*\d+\.\s+/.test(ligne);
      const items: string[] = [];
      while (i < lignes.length && (ordonnee ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lignes[i]!)) items.push(lignes[i++]!.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
      const liste = items.map((t, j) => <li key={j}>{enLigne(t, `${k}l${j}`)}</li>);
      blocs.push(ordonnee
        ? <ol key={k} className="mt-3 grid list-decimal gap-2 pl-6">{liste}</ol>
        : <ul key={k} className="mt-3 grid list-disc gap-2 pl-6">{liste}</ul>);
      continue;
    }
    const paragraphe: string[] = [];
    while (i < lignes.length && lignes[i]!.trim() && !/^(#|\||\s*[-*]\s|\s*\d+\.\s)/.test(lignes[i]!)) paragraphe.push(lignes[i++]!.trim());
    blocs.push(<p key={k} className="mt-3 leading-relaxed">{enLigne(paragraphe.join(" "), k)}</p>);
  }
  return blocs;
}

export function PageLegale({ markdown }: { markdown: string }) {
  return (
    <>
      <PublicHeader />
      <main id="contenu-principal" className="mx-auto max-w-[860px] px-5 py-10 text-[15px] text-foreground md:px-8 md:py-14">
        <article>{rendreMarkdown(markdown)}</article>
      </main>
      <Footer />
    </>
  );
}
