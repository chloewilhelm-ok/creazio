# Documentation technique : Creazio

*Handover développeur · mise à jour le 26 octobre 2026*

## Vue d'ensemble

Front TanStack Start (React) déployé sur Vercel, qui lit et écrit dans Supabase (base PostgreSQL, Auth, RLS, Realtime). Les opérations sensibles (réservation, annulation, achat de crédits) passent par des fonctions SQL côté base, en une seule transaction. Quatre Edge Functions Supabase envoient les emails (Resend) et appellent l'API Google Gemini pour l'assistant « Trouve ton atelier idéal ». Un agent Claude Cowork, hors de l'application, prospecte les artisans dans un CRM Notion à partir de vues anonymes de la base.

## Stack et versions

| Rôle | Outil | Version |
|---|---|---|
| Framework front | TanStack Start / TanStack Router | 1.168 / 1.170 |
| Interface | React | 19.2 |
| Styles | Tailwind CSS (design system « Atelier Forest & Terracotta ») | 4.2 |
| Build | Vite | 8.1 |
| Langage | TypeScript | 5.8 |
| Graphiques du dashboard | Recharts | 2.15 |
| Client base de données | @supabase/supabase-js | 2.117 |
| Base, Auth, RLS, Realtime, Edge Functions | Supabase (PostgreSQL 17, région Europe – Irlande) | — |
| Hébergement | Vercel | — |
| Emails | Resend | — |
| IA | Google Gemini (API, offre gratuite) | — |
| Tests unitaires | Vitest | 4.1 |
| Tests de bout en bout | Playwright | 1.56.1 |
| Automatisation métier | Claude Cowork + Notion | — |

## Modèle de données

17 tables dans le schéma `public`, toutes avec RLS (45 règles). Diagramme : [dbdiagram.io](https://dbdiagram.io/d/Creazio-6acb93fe27cfb7f1bcd55f3f). Migrations : `supabase/migrations/`.

| Table | Rôle | Relations | RLS (résumé) |
|---|---|---|---|
| `profiles` | Compte : rôle (élève ou artisan), identité, adresse, consentements datés | `id` = utilisateur Supabase Auth | Chacun lit et modifie son profil ; le rôle n'est pas modifiable |
| `profil_savoirs_faire` | Centres d'intérêt de l'élève | → `profiles` | Chacun gère les siens |
| `artisans` | Dossier artisan, statut de candidature, prix de référence | → `profiles` (1-1) | L'artisan lit son dossier ; les connectés voient les artisans validés ; statut et prix non modifiables par l'artisan |
| `facturation_artisans` | Raison sociale, SIRET | → `artisans` (1-1) | Propriétaire uniquement |
| `ateliers` | Atelier (titre, lieu, prix public, statut) | → `artisans` | Publiés et « lancement prochain » visibles une fois connecté ; l'artisan gère les siens ; prix et statut protégés par trigger |
| `recurrences_sessions` | Règles récurrentes (jour, heure, places, remise) | → `ateliers` | L'artisan gère les siennes |
| `sessions` | Créneaux datés générés par trigger, places restantes, prix en crédits | → `ateliers`, → `recurrences_sessions` | Lisibles pour les ateliers publiés ; places et prix non modifiables directement |
| `reservations` | Réservation, code CRZ, part artisan (85 %) | → `profiles`, → `sessions`, → `versements_artisans` | L'élève voit les siennes ; écriture uniquement via `reserver_session` / `annuler_reservation` |
| `versements_artisans` | Un versement par mois et par artisan | → `artisans` | Propriétaire uniquement |
| `packs_credits` | Packs 50 / 100 / 150 crédits | — | Lecture pour les connectés |
| `achats_credits` | Achat d'un pack (simulé en V1) | → `profiles`, → `packs_credits` | Propriétaire en lecture ; écriture via `acheter_pack_demo` |
| `lots_credits` | Un lot par achat, valable 12 mois | → `achats_credits`, → `profiles` | Propriétaire en lecture ; écriture par les fonctions serveur |
| `mouvements_credits` | Journal des débits et recrédits | → `lots_credits`, → `reservations`, → `signalements_litiges` | Propriétaire en lecture ; écriture par les fonctions serveur |
| `portefeuilles` | Solde affiché | → `profiles` (1-1) | Propriétaire en lecture ; jamais modifiable directement |
| `signalements_litiges` | Signalement après un atelier | → `reservations`, → `profiles` | Propriétaire |
| `demandes_ia` | Heure des demandes à l'IA (limite 10/h), effacée après 24 h | → `profiles` | Aucun accès utilisateur (serveur uniquement) |
| `parametres_plateforme` | Commission, validité, délais, remises min et max | — | Lecture seule |

Schéma séparé `prospection` : 4 vues agrégées et anonymes (demande et offre par zone), fermées à l'API publique, lues par l'agent Cowork.

Fonctions SQL principales (`SECURITY DEFINER`, chacune vérifie l'appelant) : `reserver_session`, `annuler_reservation`, `acheter_pack_demo`.

## Variables d'environnement

| Variable | Rôle | Où la configurer |
|---|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | URL du projet Supabase | Vercel + `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase (lisible par le navigateur, protégée par la RLS) | Vercel + `.env` |
| `VITE_SUPABASE_PROJECT_ID` / `SUPABASE_PROJECT_ID` | Identifiant du projet | Vercel + `.env` |
| `GEMINI_API_KEY` | Clé de l'assistant IA | Secrets des Edge Functions Supabase, jamais côté client |
| `RESEND_API_KEY` | Envoi des emails | Secrets des Edge Functions Supabase |
| `EMAIL_EXPEDITEUR` | Adresse d'envoi (`reservations@creazio.fr`) | Secrets des Edge Functions Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service, utilisée uniquement par les Edge Functions | Fournie automatiquement par Supabase, jamais dans le code |

Modèle sans valeurs : `.env.example`. Le fichier `.env` est dans `.gitignore`.

## Intégrations externes

- **API IA :** Google Gemini, appelée par l'Edge Function `trouver-atelier`. À partir d'une phrase de l'élève et de la liste des créneaux disponibles des 30 prochains jours, elle propose 2 à 3 ateliers ; chaque proposition est revérifiée côté serveur. Aucune donnée personnelle envoyée (phrase, arrondissement, liste des ateliers). Délai maximum de 20 s avec un nouvel essai, limite de 10 demandes par heure et par élève. Ne fonctionne pas sans `GEMINI_API_KEY`.
- **Emails (Resend) :** `envoyer-confirmation-reservation` (à chaque réservation confirmée), `alerter-verification-atelier` (à chaque nouvel atelier à vérifier) et `alerter-nouvelle-candidature` (à chaque candidature artisan), déclenchées par des triggers de la base. Un seul email par événement (colonne de verrou) ; un échec d'envoi ne bloque jamais l'action de l'utilisateur. Emails d'inscription et de mot de passe : Supabase Auth via le SMTP Resend, modèles dans `supabase/templates/`.
- **API Adresse (adresse.data.gouv.fr) :** autocomplétion et géolocalisation de l'adresse à l'inscription.
- **Automatisation :** agent Claude Cowork de prospection des artisans. Mode « Nouveau lot » à la demande (10 ateliers ciblés là où la demande n'est pas couverte, fiches et brouillons d'email dans le CRM Notion) et « Point du lundi » chaque lundi à 8h40 (relances). L'agent n'envoie aucun email et ne lit que les vues anonymes du schéma `prospection`.

## Déploiement et CI

- Chaque push sur `main` déclenche un déploiement Vercel de production sur [www.creazio.fr](https://www.creazio.fr) (domaine Gandi, HTTPS). Les autres branches donnent des déploiements de prévisualisation.
- Claude Code travaille sur une branche dédiée et ne fusionne dans `main` qu'après le build et les tests.
- Migrations SQL : `supabase/migrations/`, appliquées sur le projet Supabase après validation. Scripts de données de démo réversibles : `supabase/scripts/`.
- Edge Functions : `supabase/functions/`, déployées sur Supabase.

## Lancer en local

```sh
git clone https://github.com/chloewilhelm-ok/creazio.git
cd creazio
npm install
cp .env.example .env    # renseigner l'URL, la clé publique et l'identifiant du projet Supabase
npm run dev             # http://localhost:8080
npm test                # 133 tests unitaires
npm run test:e2e        # build puis 9 tests Playwright sur les pages publiques
```

## Points de vigilance

- **Prix :** un nouvel atelier reprend toujours le prix de référence de l'artisan et passe « en vérification » (trigger `prive.proteger_prix_atelier`). Ce trigger doit tester l'appelant avec `auth.role()`, jamais `current_user` (faille corrigée le 25/10).
- **Crédits :** ne jamais écrire directement dans `portefeuilles`, `lots_credits` ou `mouvements_credits` : passer par les fonctions serveur, qui font tout en une transaction.
- **IA :** inactive sans `GEMINI_API_KEY` ; l'offre gratuite peut être lente. Tester une demande avant toute démonstration.
- **Données de démo :** artisans fictifs en `@creazio.fr`, historique du dashboard et ateliers « Lancement prochainement » créés par les scripts de `supabase/scripts/` (chacun avec son annulation).
- **Nouveau statut d'atelier :** une valeur d'enum Postgres doit être validée dans une migration séparée avant d'être utilisée.
- **Lovable :** le dépôt reste connecté à Lovable ; ne jamais réécrire l'historique Git (pas de force push).
- **Règles d'architecture :** voir `AGENTS.md`.

## Contacts

Chloé Wilhelm · [contact@creazio.fr](mailto:contact@creazio.fr)
