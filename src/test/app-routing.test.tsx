import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each(["/devenir-artisan", "/artisan/candidature-envoyee", "/connexion", "/inscription", "/ateliers", "/espace-eleve", "/artisan/planning", "/artisan/ateliers", "/artisan/revenus", "/artisan/creer-atelier", "/artisan/atelier/atelier-test", "/artisan/modifier-atelier/atelier-test", "/espace-eleve/reservations", "/reservation/confirmation", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/cgu", "/confidentialite"])("matches the Creazio screen %s", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes(path).at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
