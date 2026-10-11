import { createFileRoute } from "@tanstack/react-router";
import { ArtisanWorkshopFormPage } from "@/components/creazio/workshop-pages";
export const Route = createFileRoute("/artisan/modifier-atelier/$workshopId")({
  head: () => ({ meta: [{ title: "Modifier mon atelier — Creazio" }, { name: "description", content: "Modifiez les informations et les sessions de votre atelier." }, { property: "og:title", content: "Modifier mon atelier — Creazio" }, { property: "og:description", content: "Modifiez les informations et les sessions de votre atelier." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: EditWorkshop,
});
function EditWorkshop() { const { workshopId } = Route.useParams(); return <ArtisanWorkshopFormPage workshopId={workshopId}/>; }