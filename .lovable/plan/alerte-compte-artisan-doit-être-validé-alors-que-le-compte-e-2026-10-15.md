# Alerte « compte artisan doit être validé » alors que le compte est validé

## Diagnostic (vérifié dans la base)

- Votre fiche artisan (chloe.wilhelm@outlook.fr) a bien `statut_candidature = validee`.
- Mais la règle de sécurité qui autorise la création d'un atelier (`prive.est_artisan_valide()`, utilisée par la policy d'insertion sur `ateliers`) exige **deux** conditions :
  1. `statut_candidature = 'validee'` — remplie chez vous ;
  2. `contrat_signe_le IS NOT NULL` — **vide chez vous** (ainsi que `candidature_validee_le`).
- L'insertion est donc refusée par la base, et le formulaire affiche le message d'alerte générique.

## Ce que je propose

1. **Renseigner les dates manquantes sur votre fiche artisan** (une migration SQL) :
   - `candidature_validee_le = now()`
   - `contrat_signe_le = now()`
   - La création d'atelier fonctionnera immédiatement après, sans changer aucune règle.

2. **Améliorer le message du formulaire** (`src/components/creazio/workshop-pages.tsx`) :
   - Distinguer « candidature non validée » de « contrat non signé » pour que l'alerte indique la vraie raison la prochaine fois.

## À vous de décider (hors de ce plan)

- Si le contrat signé ne doit **pas** être obligatoire pour créer un atelier, je peux simplifier `prive.est_artisan_valide()` pour n'exiger que `statut_candidature = 'validee'`. Dites-le-moi et je l'ajoute au plan.

## Vérification

- Requête de contrôle confirmant les deux dates remplies.
- Test dans l'aperçu : création d'un atelier avec votre compte, présence de la ligne dans la table `ateliers`.
