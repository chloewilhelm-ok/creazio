# QA — tests de bout en bout (Playwright) et tests unitaires

## Ce qui est testé

Les tests Playwright parcourent le **site construit** (build de production), en local, **sans compte ni base** : les appels à Supabase sont interceptés et renvoient une réponse vide, et aucune donnée ne quitte le poste. Chaque test tourne sur deux affichages : **ordinateur** (1440 × 900) et **iPhone** (390 × 844, écran tactile).

| Test | Ce qui est vérifié |
|---|---|
| Landing | Le titre « L'atelier créatif près de chez vous, à prix doux. » et l'atout « Jusqu'à -50 % de réduction » sont affichés |
| Pages légales | Dans le pied de page, « CGU » ouvre `/cgu` et « Confidentialité » ouvre `/confidentialite`, chacun avec le bon titre |
| Lien d'évitement | À la première tabulation, « Aller au contenu principal » reçoit le focus et devient visible ; Entrée place le focus sur le contenu principal |
| Connexion | La page `/connexion` affiche le champ email et le champ mot de passe, avec le texte d'exemple « 8 caractères minimum » |
| En-tête mobile (iPhone seulement) | Après un défilement vers le bas puis vers le haut, le titre de la landing est visible et commence sous l'en-tête |

Fichiers : `e2e/parcours-publics.spec.ts` (tests), `playwright.config.ts` (configuration), `e2e/serveur-build.mjs` (sert le site construit comme Vercel).

## Comment lancer

```sh
npm install
npm run test:e2e     # construit le site (vite build), le sert sur http://127.0.0.1:4173, puis lance Playwright
```

Le navigateur Chromium de Playwright doit être installé (`npx playwright install chromium` sur un nouveau poste). La version de `@playwright/test` est fixée à 1.56.1 dans `package.json`.

## Résultat de l'exécution

**27 octobre 2026** : `npm run test:e2e`, build de production local, Chromium 1.56.1.

```
Running 10 tests using 2 workers
  ✓ [ordinateur] la landing affiche l'accroche et « Jusqu'à -50 % »
  ✓ [iphone]     la landing affiche l'accroche et « Jusqu'à -50 % »
  ✓ [ordinateur] les liens CGU et Confidentialité du pied de page ouvrent les bonnes pages
  ✓ [iphone]     les liens CGU et Confidentialité du pied de page ouvrent les bonnes pages
  ✓ [ordinateur] le lien « Aller au contenu principal » apparaît à la première tabulation
  ✓ [iphone]     le lien « Aller au contenu principal » apparaît à la première tabulation
  ✓ [ordinateur] la page de connexion s'affiche
  ✓ [iphone]     la page de connexion s'affiche
  ✓ [iphone]     en iPhone, le titre de la landing reste visible après un défilement aller-retour
  - [ordinateur] (même test, ignoré : il est propre au viewport iPhone)

  9 passed, 1 skipped (5.8 s)
```

## Captures (docs/qa/)

Prises automatiquement pendant l'exécution :

| Capture | Ordinateur | iPhone |
|---|---|---|
| Landing | [`landing-ordinateur.png`](qa/landing-ordinateur.png) | [`landing-iphone.png`](qa/landing-iphone.png) |
| Landing après défilement aller-retour | — | [`landing-iphone-apres-defilement.png`](qa/landing-iphone-apres-defilement.png) |
| Politique de confidentialité | [`confidentialite-ordinateur.png`](qa/confidentialite-ordinateur.png) | [`confidentialite-iphone.png`](qa/confidentialite-iphone.png) |
| Connexion | [`connexion-ordinateur.png`](qa/connexion-ordinateur.png) | [`connexion-iphone.png`](qa/connexion-iphone.png) |

## Tests unitaires existants (Vitest)

```sh
npm test             # vitest run
```

**136 tests dans 20 fichiers** (`src/test/`), tous verts le 27 octobre 2026. Ils couvrent les règles métier :
- rôles et gardes d'accès par espace ;
- inscription et consentements RGPD ;
- réservation, annulation et crédits ;
- prix barré en crédits ;
- filtres de recherche (lieu, budget, créneau à l'heure de Paris) ;
- dashboard artisan (indicateurs, versements mensuels le 15 du mois suivant) ;
- contenu des emails (confirmation de réservation, alerte « atelier à vérifier », alerte « nouvelle candidature ») ;
- assistant IA : aucune donnée personnelle ni nom d'artisan envoyés à Gemini ;
- rendu des pages légales ;
- routage.

## Limites

- Les parcours connectés (réservation, dashboard artisan) ne sont pas couverts par Playwright, car ils demandent un compte et une base. Leurs règles métier sont couvertes par les tests unitaires ; le parcours complet se vérifie à la main sur www.creazio.fr.
- Le viewport iPhone est simulé avec Chromium : le moteur WebKit de Safari n'est pas installé dans l'environnement de test.
