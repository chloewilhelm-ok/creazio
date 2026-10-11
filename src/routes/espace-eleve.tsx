import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth";
export const Route = createFileRoute("/espace-eleve")({ beforeLoad: () => requireSession("eleve"), component: () => <Outlet/> });
