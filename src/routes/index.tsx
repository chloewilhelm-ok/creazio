import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/creazio/pages";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Creazio — L’atelier créatif près de chez vous, à prix doux" },
    { name: "description", content: "Réservez en quelques clics chez les meilleurs artisans près de chez vous, à des tarifs moins chers." },
    { property: "og:title", content: "Creazio — L’atelier créatif près de chez vous, à prix doux" },
    { property: "og:description", content: "Réservez en quelques clics chez les meilleurs artisans près de chez vous, à des tarifs moins chers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});
