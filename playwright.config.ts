import { defineConfig, devices } from "@playwright/test";

// Tests de bout en bout des parcours publics, contre le site construit en local (npm run test:e2e).
// Aucun compte ni base : les appels à Supabase sont interceptés dans les tests.
export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4173", locale: "fr-FR" },
  webServer: {
    command: "node e2e/serveur-build.mjs .vercel/output 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "iphone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});
