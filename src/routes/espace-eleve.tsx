import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/espace-eleve")({ component: () => <Outlet/> });