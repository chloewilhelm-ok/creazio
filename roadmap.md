# Modifications Creazio

- [x] Générer les sessions datées à partir des horaires artisan et afficher les créneaux disponibles aux élèves — 32 créneaux réels vérifiés, 21 tests réussis ; contrôle connecté indisponible avec Supabase externe.

- [x] Harmoniser les catégories actuelles entre inspirations élève, profil, recherche et savoir-faire artisan.
- [ ] Remplacer par la nouvelle liste d’inspirations : bloqué, liste absente du message et du ZIP ; question ignorée.
- [x] Afficher quatre étoiles et demie et ajouter l’achat de crédits dans « Comment ça marche ».
- [x] Compléter la localisation et les techniques précises dans l’onboarding artisan.
- [x] Créer le formulaire atelier et la vue de détail/modification depuis le planning selon Stitch.
- [x] Tester les interactions et vérifier l’affichage.
- [x] Lire le schéma Supabase existant et générer les types — 15 tables et les énumères sont déjà couverts par `src/integrations/supabase/types.ts`.
- [x] Brancher connexion / inscription élève et artisan sur Supabase Auth — création du profil via `ensureProfile`, données en attente dans `user_metadata` si confirmation d'email requise.
- [x] Remplacer les packs de crédits codés en dur par la lecture de packs_credits (packs actifs seulement) — la liste codée en dur sert de repli si la table est vide.
- [x] RLS : règles installées dans Supabase ; lecture des sessions des ateliers publiés autorisée aux utilisateurs connectés.