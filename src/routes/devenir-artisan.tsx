import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/devenir-artisan")({ component: () => <Outlet/> });