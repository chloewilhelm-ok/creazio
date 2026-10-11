import { createFileRoute } from "@tanstack/react-router";
import { ArtisanWorkshopDetailPage } from "@/components/creazio/workshop-pages";
export const Route = createFileRoute("/artisan/atelier/$workshopId")({
  head: () => ({ meta: [{ title: "Zoom sur un atelier — Creazio" }, { name: "description", content: "Consultez et gérez un atelier depuis votre planning artisan." }, { property: "og:title", content: "Zoom sur un atelier — Creazio" }, { property: "og:description", content: "Consultez et gérez un atelier depuis votre planning artisan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: WorkshopDetail,
});
function WorkshopDetail() { const { workshopId } = Route.useParams(); return <ArtisanWorkshopDetailPage workshopId={workshopId}/>; }