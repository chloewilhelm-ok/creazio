import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/creazio/page-legale";
import texte from "../../docs/legal/cgu.md?raw";
// Page publique (pas de requireSession) : texte de docs/legal/cgu.md.
export const Route = createFileRoute("/cgu")({ head: () => ({ meta: [{ title: "Conditions générales d’utilisation — Creazio" }, { name: "description", content: "Conditions générales d’utilisation de Creazio." }] }), component: () => <PageLegale markdown={texte} /> });
