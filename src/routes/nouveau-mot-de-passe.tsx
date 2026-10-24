import { createFileRoute } from "@tanstack/react-router";
import { NewPasswordPage } from "@/components/creazio/pages";
export const Route = createFileRoute("/nouveau-mot-de-passe")({ head: () => ({ meta: [{title:"Nouveau mot de passe — Creazio"},{name:"robots",content:"noindex"}] }), component: NewPasswordPage });
