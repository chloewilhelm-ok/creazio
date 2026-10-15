import { createFileRoute } from "@tanstack/react-router";
import { ArtisanProfilePage } from "@/components/creazio/artisan-profile";
export const Route = createFileRoute("/artisan/profil")({ head: () => ({ meta: [{title:"Mon profil artisan — Creazio"},{name:"description",content:"Modifiez les informations de votre atelier."},{property:"og:title",content:"Mon profil artisan — Creazio"},{property:"og:description",content:"Modifiez les informations de votre atelier."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}] }), component: ArtisanProfilePage });
