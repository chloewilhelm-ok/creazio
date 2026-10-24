import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/components/creazio/pages";
export const Route = createFileRoute("/mot-de-passe-oublie")({ head: () => ({ meta: [{title:"Mot de passe oublié — Creazio"},{name:"description",content:"Recevez un lien pour choisir un nouveau mot de passe Creazio."},{name:"robots",content:"noindex"}] }), component: ForgotPasswordPage });
