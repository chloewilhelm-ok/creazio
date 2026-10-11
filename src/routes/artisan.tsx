import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth";
export const Route = createFileRoute("/artisan")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Les écrans de connexion et d'inscription artisan restent accessibles sans session.
    if (location.pathname === "/artisan/connexion" || location.pathname === "/artisan/inscription") return;
    await requireSession("artisan");
  },
  component: () => <Outlet/> });
