import { createFileRoute, redirect } from "@tanstack/react-router";
// Ancienne page de candidature : la candidature se fait désormais à l'inscription artisan.
export const Route = createFileRoute("/devenir-artisan/candidature")({
  beforeLoad: () => {
    throw redirect({ to: "/artisan/inscription", replace: true });
  },
});
