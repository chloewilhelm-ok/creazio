import { createFileRoute } from "@tanstack/react-router";
import { ApplicationPendingPage } from "@/components/creazio/pages";
export const Route = createFileRoute("/artisan/candidature-envoyee")({ head: () => ({ meta: [{title:"Candidature en cours — Creazio"},{name:"robots",content:"noindex"}] }), component: ApplicationPendingPage });
