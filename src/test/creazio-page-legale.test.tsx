import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/creazio/pages", () => ({ PublicHeader: () => null, Footer: () => null }));

import { rendreMarkdown } from "@/components/creazio/page-legale";

const html = (md: string) => renderToStaticMarkup(<>{rendreMarkdown(md)}</>);

describe("pages légales (Markdown)", () => {
  it("rend titres, listes, gras et tableaux", () => {
    const h = html("# Titre\n\n## Partie\n\n- un **point**\n- deux\n\n| A | B |\n|---|---|\n| 1 | 2 |");
    expect(h).toContain("<h1");
    expect(h).toContain("<h2");
    expect(h).toContain("<strong");
    expect(h.match(/<li>/g)).toHaveLength(2);
    expect(h).toContain('<th scope="col"');
    expect(h).toContain(">2</td>");
  });
  it("transforme les emails en liens sans avaler la ponctuation", () => {
    const h = html("Écrivez à contact@creazio.fr.");
    expect(h).toContain('href="mailto:contact@creazio.fr"');
    expect(h).toContain("</a>.");
  });
});
