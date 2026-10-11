import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/creazio/pages";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Creazio — Ateliers créatifs en Île-de-France" },
    { name: "description", content: "Trouvez et réservez des ateliers créatifs auprès d’artisans franciliens." },
    { property: "og:title", content: "Creazio — Ateliers créatifs en Île-de-France" },
    { property: "og:description", content: "Trouvez et réservez des ateliers créatifs auprès d’artisans franciliens." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});
