# Creazio

**L'atelier créatif près de chez vous, à prix doux.**

Creazio est une marketplace d'ateliers créatifs en Île-de-France : poterie, cuir, vitrail, bois, cuisine, bijouterie… Les artisans y proposent leurs **créneaux creux** avec une remise de 20 à 50 %, et les élèves les réservent avec des **crédits** achetés à l'avance.

## Le modèle à crédits

- **1 crédit = 1 €.** L'élève achète un pack (Découverte 50, Régulier 100, Passionné 150 crédits), valable 12 mois.
- Le prix d'un créneau est calculé par la base à partir du **prix public de référence** de l'atelier (fixé avec Creazio) et de la remise choisie par l'artisan. Côté élève, tout est exprimé en crédits, avec le prix sans remise barré.
- Creazio prélève **15 %** de commission. L'artisan reçoit **85 %**, versés une fois par mois, le **15 du mois suivant**, pour les ateliers qui ont eu lieu.
- L'annulation est gratuite jusqu'à 48 h avant l'atelier. Les crédits sont alors recrédités.

> Version de démonstration : l'achat de crédits est simulé, aucun paiement réel n'est demandé.

## Liens

- Site : [www.creazio.fr](https://www.creazio.fr)
- Conditions générales : [`docs/legal/cgu.md`](docs/legal/cgu.md) (en ligne sur [/cgu](https://www.creazio.fr/cgu))
- Politique de confidentialité : [`docs/legal/confidentialite.md`](docs/legal/confidentialite.md) (en ligne sur [/confidentialite](https://www.creazio.fr/confidentialite))
- Design system : [`docs/design-system.md`](docs/design-system.md)
- Audit de sécurité : [`docs/audit-securite.md`](docs/audit-securite.md)
- Maquettes Stitch : [`docs/maquettes-stitch/`](docs/maquettes-stitch/)

## Fonctionnalités

### Élève
- Inscription en 3 étapes (compte, adresse avec autocomplétion, savoir-faire préférés), avec les consentements RGPD datés.
- Accueil avec des recommandations proches de chez soi et l'assistant IA **« Trouve ton atelier idéal »**.
- Recherche par mot-clé et savoir-faire, avec des **filtres** lieu (arrondissement, petite et grande couronne), budget et créneau, et un tri par distance ou par prix.
- Fiche atelier : nom de l'artisan, créneaux réels avec jauge de places, prix en crédits et prix barré. Sur mobile, la barre de réservation reste fixée en bas de l'écran.
- Réservation en un clic : les crédits sont débités et un code **CRZ-XXXXXX** est affiché et envoyé par email.
- « Mes réservations » : réservations à venir (annulation gratuite jusqu'à 48 h avant) et ateliers passés avec « Réserver à nouveau ».
- Profil, solde et achat de packs (simulé).

### Artisan
- Landing dédiée, candidature (nom de l'atelier, adresse, savoir-faire). L'espace artisan s'ouvre une fois la candidature validée par Creazio.
- Création et modification d'ateliers. Le prix public est repris du prix de référence fixé avec Creazio. Chaque nouvel atelier est vérifié avant publication, et une alerte email part vers contact@creazio.fr.
- Récurrences de créneaux (jour, heure, places ouvertes à Creazio, remise), à partir desquelles la base génère automatiquement les séances datées.
- Planning et liste des participants (prénom et code de réservation).
- **« Mes revenus »**, en temps réel :
  - bloc **À venir** : réservations, revenus prévus, remplissage par créneau ;
  - bloc **Passé** : prochain versement, versements mois par mois, réservations par semaine, réservations passées.

### Creazio (agent de prospection)
- Des vues **anonymes** (agrégats uniquement) croisent la demande des élèves et l'offre d'ateliers par zone et par savoir-faire. Un agent **Claude Cowork** les lit pour repérer les savoir-faire manquants et prépare la prospection d'artisans dans **Notion**.

## Stack technique

| Brique | Rôle |
|---|---|
| **TanStack Start** (React 19, TanStack Router, TanStack Query) | Application web : routes typées, gardes d'accès par rôle (`beforeLoad`), chargement et cache des données |
| **Tailwind CSS v4** | Mise en forme, avec les jetons du design system (Deep Forest, Terracotta, Laiton) |
| **Recharts** | Graphiques du dashboard artisan, accompagnés de résumés texte et de tableaux pour l'accessibilité |
| **Supabase Auth** | Comptes élèves et artisans, emails d'authentification en français |
| **Supabase Postgres + RLS** | Base de données. Chaque utilisateur ne lit que ses propres données (règles RLS et droits par colonne) |
| **Fonctions SQL** (SECURITY DEFINER) | Opérations sensibles côté serveur : réserver, annuler, acheter un pack, générer les séances, protéger les prix |
| **Supabase Edge Functions** (Deno) | `trouver-atelier` (assistant IA), `envoyer-confirmation-reservation` et `alerter-verification-atelier` (emails) |
| **Supabase Realtime** | Mise à jour en direct du dashboard artisan à chaque réservation |
| **Vercel** | Hébergement et déploiement continu depuis la branche `main` |
| **Resend** | Envoi des emails (confirmation de réservation, alerte de vérification, emails d'authentification par SMTP) |
| **Google Gemini** (Flash-Lite) | Assistant « Trouve ton atelier idéal ». Seuls la phrase saisie, l'arrondissement et la liste des ateliers disponibles lui sont envoyés |
| **Claude Cowork + Notion** | Agent de prospection : lecture des vues anonymes, suivi des artisans à contacter dans Notion |
| **Claude Code** | Développement assisté depuis le 18/10/2026 |

## Architecture des dossiers

```
src/
  routes/                 Une route par fichier (TanStack Router) ; routeTree.gen.ts est généré
  components/creazio/     Écrans et composants de Creazio (pages, fiche, créneaux, filtres, dashboard…)
  components/ui/          Composants de base (shadcn/ui)
  lib/                    Logique sans interface : authentification et rôles, réservations, filtres,
                          tableau de bord, assistant IA, adresses (fonctions testées)
  integrations/supabase/  Client Supabase et types générés de la base
  test/                   Tests Vitest
supabase/
  migrations/             Évolutions du schéma (tables, RLS, fonctions, triggers), dans l'ordre
  functions/              Edge Functions (Deno)
  scripts/                Scripts SQL de diagnostic et de données de démo, réversibles
  templates/              Modèles des emails d'authentification
docs/                     Design system, audit de sécurité, textes légaux, maquettes Stitch
public/ateliers/          Photos des ateliers de démo
```

## Installation et lancement en local

Prérequis : Node.js 20 ou plus et npm.

```sh
git clone https://github.com/chloewilhelm-ok/creazio.git
cd creazio
npm install
cp .env.example .env    # puis renseigner les valeurs
npm run dev             # http://localhost:8080
```

Variables de `.env` (voir `.env.example`). **Uniquement des valeurs publiques** :

| Variable | Contenu |
|---|---|
| `VITE_SUPABASE_URL`, `SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` | Clé **publique** (publishable / anon) |
| `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID` | Identifiant du projet |

Les clés secrètes (clé service Supabase, Resend, Gemini) ne vont **jamais** dans `.env` ni dans le code. Elles sont enregistrées dans les secrets des Edge Functions Supabase.

## Tests

```sh
npm test          # tests unitaires Vitest
npm run lint      # ESLint
npm run build     # build de production
```

Les tests couvrent les règles métier : rôles et gardes d'accès, inscription et consentements, réservation et annulation, filtres de recherche, calculs du dashboard (versements mensuels), emails, assistant IA (aucune donnée personnelle envoyée à Gemini) et pages légales.

## Déploiement

- **Site** : chaque push sur `main` est déployé par Vercel. Les variables publiques sont définies dans les réglages du projet Vercel.
- **Base** : les migrations de `supabase/migrations/` sont appliquées sur le projet Supabase, après validation.
- **Edge Functions** : déployées sur Supabase. Leurs secrets (`RESEND_API_KEY`, `GEMINI_API_KEY`, `EMAIL_EXPEDITEUR`) sont saisis dans le tableau de bord Supabase.

## Sécurité

L'audit complet est dans [`docs/audit-securite.md`](docs/audit-securite.md) : points contrôlés, alertes corrigées, risques assumés en V1 et recommandations pour la production. En résumé :
- aucune clé secrète dans le code ni dans l'historique Git ;
- RLS sur toutes les tables ;
- les prix sont fixés par Creazio, jamais par l'artisan ;
- les opérations sur les crédits passent uniquement par des fonctions serveur.

## Documents

- [`docs/design-system.md`](docs/design-system.md) : couleurs, typographies, composants, contrastes WCAG.
- [`docs/legal/`](docs/legal/) : CGU et politique de confidentialité (source des pages `/cgu` et `/confidentialite`).
- [`docs/maquettes-stitch/`](docs/maquettes-stitch/) : maquettes Google Stitch exportées et audits d'accessibilité.
- [`docs/audit-securite.md`](docs/audit-securite.md) : audit de sécurité.
- [`AGENTS.md`](AGENTS.md) : règles d'architecture à respecter lors des modifications.

## Historique

- **Jusqu'au 18/10/2026** : prototype construit avec **Lovable**, qui reste connecté au dépôt.
- **Depuis le 18/10/2026** : développement avec **Claude Code**. Chaque commit est nommé par module du référentiel, par exemple « M4 - Email de confirmation automatique à la réservation » ou « M5 - Recherche : filtres lieu, budget et créneau ».
- L'historique Git n'est jamais réécrit, pour préserver la synchronisation avec Lovable.
