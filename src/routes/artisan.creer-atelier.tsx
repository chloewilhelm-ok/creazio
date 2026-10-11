import { createFileRoute } from "@tanstack/react-router";
import { ArtisanWorkshopFormPage } from "@/components/creazio/workshop-pages";
export const Route = createFileRoute("/artisan/creer-atelier")({
  head: () => ({ meta: [{ title: "Créer un atelier — Creazio" }, { name: "description", content: "Présentez votre savoir-faire et préparez vos sessions Creazio." }, { property: "og:title", content: "Créer un atelier — Creazio" }, { property: "og:description", content: "Présentez votre savoir-faire et préparez vos sessions Creazio." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ArtisanWorkshopFormPage,
});