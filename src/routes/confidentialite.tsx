import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/creazio/page-legale";
import texte from "../../docs/legal/confidentialite.md?raw";
// Page publique (pas de requireSession) : texte de docs/legal/confidentialite.md.
export const Route = createFileRoute("/confidentialite")({ head: () => ({ meta: [{ title: "Politique de confidentialité — Creazio" }, { name: "description", content: "Politique de confidentialité de Creazio." }] }), component: () => <PageLegale markdown={texte} /> });
