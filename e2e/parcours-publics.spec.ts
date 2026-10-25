import { expect, test, type Page } from "@playwright/test";

// Parcours publics de Creazio, sans compte : Supabase est intercepté (réponse vide), rien ne sort du poste.
test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", (route) =>
    route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "content-type": "application/json" }, body: "[]" }),
  );
});

const capture = (page: Page, nom: string) => page.screenshot({ path: `docs/qa/${nom}.png` });

test("la landing affiche l'accroche et « Jusqu'à -50 % »", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "L’atelier créatif près de chez vous, à prix doux." })).toBeVisible();
  await expect(page.getByText("Jusqu’à -50 % de réduction")).toBeVisible();
  await capture(page, `landing-${info.project.name}`);
});

test("les liens CGU et Confidentialité du pied de page ouvrent les bonnes pages", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "CGU" }).click();
  await expect(page).toHaveURL(/\/cgu$/);
  await expect(page.getByRole("heading", { level: 1, name: "Conditions générales d'utilisation" })).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "Confidentialité" }).click();
  await expect(page).toHaveURL(/\/confidentialite$/);
  await expect(page.getByRole("heading", { level: 1, name: "Politique de confidentialité" })).toBeVisible();
  await capture(page, `confidentialite-${info.project.name}`);
});

test("le lien « Aller au contenu principal » apparaît à la première tabulation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const lien = page.getByRole("link", { name: "Aller au contenu principal" });
  await expect(lien).toBeFocused();
  await expect(lien).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenu-principal")).toBeFocused();
});

test("la page de connexion s'affiche", async ({ page }, info) => {
  await page.goto("/connexion");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toHaveAttribute("placeholder", "8 caractères minimum");
  await capture(page, `connexion-${info.project.name}`);
});

test("en iPhone, le titre de la landing reste visible après un défilement aller-retour", async ({ page }, info) => {
  test.skip(info.project.name !== "iphone", "Vérification propre au viewport iPhone (390 × 844).");
  await page.goto("/");
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -3000);
  await page.waitForTimeout(400);
  const entete = await page.locator("header").first().boundingBox();
  const titre = page.getByRole("heading", { level: 1 });
  await expect(titre).toBeInViewport();
  const boite = await titre.boundingBox();
  expect(boite!.y).toBeGreaterThanOrEqual(entete!.y + entete!.height);
  await capture(page, "landing-iphone-apres-defilement");
});
