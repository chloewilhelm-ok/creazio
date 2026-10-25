# Audit de sécurité — Creazio

- **Date** : 25 octobre 2026
- **Réalisé avec** : Claude Code (agent IA de développement), sous la supervision de Chloé Wilhelm. Lectures et diagnostics libres ; toute modification de la base validée au préalable.
- **Livrable** : n° 9 du jury RNCP, compétence C7.
- **Périmètre** :
  - le dépôt Git `chloewilhelm-ok/creazio`, historique complet ;
  - le code envoyé au navigateur (build Vercel) ;
  - la base Supabase `fljqrpshvlldtuseoogb` : RLS, droits par colonne, fonctions, schémas `prospection` et `prive`, advisors de sécurité ;
  - les Edge Functions et leurs secrets.
- **Méthode** :
  - recherche de motifs de clés dans tout `git log -p` (`sb_secret_`, `service_role`, `re_…`, `AIza…`, `postgres://…:…@`, affectations de clés Resend, Gemini, Mistral) ;
  - décodage des jetons JWT trouvés, pour lire leur rôle ;
  - analyse du bundle client ;
  - requêtes de lecture sur `pg_policies`, `information_schema.column_privileges` et `pg_proc` ;
  - advisors Supabase ;
  - essais d'écriture en se faisant passer pour un artisan (`set role authenticated` et jeton simulé), dans une transaction annulée (rollback).

## Points contrôlés

| Point contrôlé | Résultat | Gravité | Correction |
|---|---|---|---|
| `.env` suivi par Git | Oui, dans 2 commits. Il ne contient que l'URL, l'identifiant du projet et la **clé publique** (`sb_publishable_…`, JWT `role: anon`). | Faible | Retiré du suivi (fichier local conservé), `.env` et `.env.*` ajoutés au `.gitignore`, `.env.example` sans valeurs créé. |
| Clés secrètes dans l'historique Git | Aucune clé secrète Supabase, Resend, Gemini ou Mistral, ni mot de passe de base. La seule occurrence de `sb_secret_` est le nom d'un test de format dans le code de la bibliothèque Supabase. | — | Aucune : l'historique n'est pas réécrit (voir risques assumés). |
| Clé utilisée par le navigateur | Le bundle ne contient que la clé publique (`role: anon`). La clé `service_role` n'est lue que côté serveur (`client.server.ts`, Edge Functions). | — | — |
| Secrets des Edge Functions | `RESEND_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et `EMAIL_EXPEDITEUR` sont lus avec `Deno.env.get`. Aucune clé n'est écrite dans le code. | — | — |
| Connexion exigée par les Edge Functions | `trouver-atelier` : jeton vérifié et rôle élève exigé, quota de 10 demandes par heure, aucune donnée personnelle envoyée à Gemini. Les fonctions d'email (`envoyer-confirmation-reservation`, `alerter-verification-atelier`) sont appelées par la base sans jeton : chacune ne reçoit qu'un identifiant, relit tout côté serveur et n'envoie qu'**un seul** email par événement (colonne de verrou), à un destinataire déterminé par la base. | Faible | — |
| Fonction de diagnostic `diag-gemini` | Encore déployée (neutralisée, réponse 410). | Faible | Supprimée. |
| RLS des tables sensibles | RLS activé sur les 17 tables. `profiles`, `portefeuilles`, `lots_credits`, `mouvements_credits`, `achats_credits`, `reservations`, `facturation_artisans` et `versements_artisans` ne sont lisibles que par leur propriétaire (`auth.uid()`). Aucune règle n'autorise un élève à modifier un solde, un lot ou un achat : ces écritures ne passent que par des fonctions serveur. | — | — |
| `demandes_ia` | RLS activé sans aucune règle : seul le serveur (clé service) lit et écrit. C'est volontaire (alerte « INFO » de l'advisor). | — | — |
| Droits par colonne | Un utilisateur ne peut modifier ni son `role`, ni le statut de sa candidature, ni le `statut` ou le prix d'un atelier, ni les places restantes ou le prix d'une session. | — | — |
| Schéma `prospection` | Aucun droit pour `anon` ou `authenticated`, schéma non exposé par l'API ; il ne contient que des agrégats. | — | — |
| Advisor « SECURITY DEFINER appelable par un utilisateur connecté » (7) | Voulu : réserver, annuler, acheter un pack de démo, voir ses participants ou ses réservations. Chaque fonction identifie l'appelant (`prive.eleve_connecte()`, `auth.uid()`, `session_appartient_a_moi`). | Faible | — |
| Advisor « Protection contre les mots de passe divulgués » | Désactivée (réglage Auth, vérification HaveIBeenPwned). | Moyenne | Recommandation pour la production (voir plus bas). |
| **Prix d'un atelier fixé par l'artisan** (trouvé par essai) | Le trigger `proteger_prix_atelier` testait `current_user`, qui vaut le propriétaire de la fonction dans un SECURITY DEFINER. Ce test n'était jamais vrai : un artisan pouvait fixer le prix d'un nouvel atelier en appelant l'API. Le risque était limité, car l'atelier restait invisible tant que Creazio ne le publiait pas. | **Élevée** | Corrigé avec `auth.role()`. Vérifié : un prix de 999 € envoyé est remplacé par le prix de référence de l'artisan (migration `20261025093000_correctif_proteger_prix.sql`). |
| Alerte de vérification | Chaque atelier créé ou repassé en vérification envoie un email à contact@creazio.fr. Testé le 25/10 (réponse Resend 200), puis l'atelier de test a été supprimé. | — | — |

## Alertes corrigées

1. `.env` retiré du suivi Git, `.gitignore` complété, `.env.example` sans valeurs.
2. Edge Function de diagnostic `diag-gemini` supprimée.
3. Faille du prix d'atelier : `current_user` remplacé par `auth.role()` dans `prive.proteger_prix_atelier`.

## Risques restants assumés en V1

- **Historique Git non réécrit.** Il ne contient que la clé **publique**, conçue pour être visible : elle est de toute façon lisible dans le code de toute page du site. Sans connexion, elle ne donne accès à rien, et toutes les données sont protégées par le RLS. Réécrire l'historique casserait la synchronisation avec Lovable, sans aucun gain de sécurité.
- **Paiement simulé.** `acheter_pack_demo` crédite des packs sans paiement réel. Il reste ouvert à tout élève connecté pour que le jury puisse tester.
- **Vues de prospection sans seuil d'anonymisation.** Ce sont des comptages par zone et par savoir-faire. Dans une zone peu peuplée, un comptage de 1 pourrait se rapporter à une seule personne. Les vues ne sont lisibles que par l'agent de prospection.
- **Offre gratuite de Gemini.** Selon les conditions de Google, les demandes peuvent servir à améliorer ses modèles. Seuls partent la phrase de l'élève, son arrondissement et la liste des ateliers : ni nom, ni email, ni adresse, ni identifiant.
- **Fonctions d'email appelables sans jeton.** Elles sont protégées par le verrou « un seul email par événement » et par un destinataire fixé côté serveur. Un appel extérieur ne peut donc ni changer le destinataire ni multiplier les envois.

## Recommandations pour la production

1. **Juste après la soutenance** : réserver l'achat simulé au compte de démonstration (vérification de l'email dans `auth.users`, que l'utilisateur ne peut pas modifier). **Ensuite** : brancher Stripe. Les crédits ne seraient ajoutés qu'après confirmation du paiement (webhook signé), et `acheter_pack_demo` serait supprimée.
2. Activer la protection contre les mots de passe divulgués (Supabase → Authentication → Sign In / Providers → Email). Elle est disponible à partir de l'offre Pro.
3. Passer Gemini sur l'offre payante, dont les données ne servent pas à entraîner les modèles, ou ajouter cette mention à la politique de confidentialité.
4. Ajouter un seuil d'anonymisation aux vues de prospection (par exemple, masquer les comptages inférieurs à 5).
5. Signer les appels de la base vers les Edge Functions d'email avec un secret partagé (en-tête vérifié par la fonction).
6. Tant que la clé est déjà diffusée, changer la clé publique n'apporte rien. En revanche, en cas de doute sur la clé **secrète**, il faut la changer dans Supabase (Project Settings → API Keys), puis mettre à jour les secrets des Edge Functions.
7. Relancer les advisors Supabase après chaque migration.
