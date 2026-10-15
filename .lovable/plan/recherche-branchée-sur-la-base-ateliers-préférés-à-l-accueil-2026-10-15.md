# Recherche branchée sur la base + ateliers préférés à l'accueil

## Pourquoi rien n'apparaît dans « Rechercher »
1. La page « Rechercher » n'interroge pas encore Supabase : elle n'affiche qu'un état vide.
2. Votre base ne montre aux élèves que les ateliers au statut « publié ». Votre seul atelier (« test ») est « en vérification », il resterait donc invisible même une fois la page branchée.
3. Il n'a ni coordonnées GPS ni session datée (3 récurrences, 0 session).

## 1. « Rechercher » : tous les ateliers publiés par défaut
- La page charge tous les ateliers publiés, sans filtre au départ (les plus récents d'abord).
- Les filtres existants (catégorie, recherche texte) affinent ensuite cette liste, côté écran.
- Fiche atelier (`/ateliers/:id`) lue depuis la base aussi.
- Pour voir « test » : passez son statut à `publie` dans Supabase (je vous donnerai la ligne SQL).

## 2. « Ateliers préférés » à l'accueil élève
Règle : ateliers publiés, situés à **5 km maximum** du domicile, dont le savoir-faire fait partie des centres d'intérêt de l'élève (onboarding ou « Mon profil »). Tri du plus proche au plus lointain, 6 ateliers max.
- Si l'élève n'a pas d'adresse ou de centres d'intérêt : message l'invitant à compléter « Mon profil ».
- Si aucun atelier ne correspond : message + bouton « Tout explorer ».

### Coordonnées GPS (nécessaires pour la distance)
- Calcul automatique via le service gratuit de l'État `api-adresse.data.gouv.fr` (aucune clé) à partir de l'adresse saisie :
  - à l'inscription et à la modification de l'adresse élève (profiles.latitude/longitude) ;
  - à la création/modification d'un atelier (ateliers.latitude/longitude).
- Les adresses déjà en base sans coordonnées sont complétées une fois.

## Modifications Supabase (aucune table ni colonne créée/renommée/supprimée)
- Nouvelle fonction `ateliers_recommandes(rayon_km default 5)` : lit le domicile et les centres d'intérêt de l'élève connecté (via `auth.uid()`), calcule la distance (formule de Haversine, sans extension), renvoie les ateliers publiés correspondants avec leur distance. Exécutable uniquement par les membres connectés ; elle ne renvoie que des ateliers publiés.
- Vérifier que les centres d'intérêt modifiés dans « Mon profil » sont bien écrits dans `profil_savoirs_faire` (sinon brancher cette écriture).

## Détails techniques
- Lecture `ateliers` via le client Supabase navigateur (RLS existante `statut = 'publie'`), jointure `artisans(nom_commercial)` ; mapping `savoir_faire` -> libellé via `savoirFaireByCategory`.
- Requêtes en TanStack Query (`queryOptions` partagés) dans `WorkshopsPage`, `StudentHomePage`, fiche atelier.
- Géocodage : helper `geocodeAddress()` dans `src/lib/geocode.ts` (fetch `https://api-adresse.data.gouv.fr/search/?q=...&limit=1`), appelé avant les upserts profil/atelier ; échec silencieux (coordonnées null).
- RPC `supabase.rpc('ateliers_recommandes', { rayon_km: 5 })`, SQL `STABLE SECURITY DEFINER SET search_path = public`, `REVOKE ... FROM public, anon; GRANT EXECUTE ... TO authenticated`.
- Tests : rayon par défaut 5 km et calcul de distance (Paris 11e vs 18e > 5 km).
