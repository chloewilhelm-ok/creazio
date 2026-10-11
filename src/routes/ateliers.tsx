import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/ateliers")({ component: () => <Outlet/> });