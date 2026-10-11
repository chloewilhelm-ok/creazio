import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth";
export const Route = createFileRoute("/espace-eleve")({ ssr: false, beforeLoad: () => requireSession("eleve"), component: () => <Outlet/> });
