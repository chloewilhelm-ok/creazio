# Plan de transformation de Creazio

## Objectif
Recréer les 16 maquettes Stitch en application React 19 + TypeScript + Tailwind CSS v4, avec une navigation complète, des interactions utiles, une architecture mobile-first et un backend Supabase externe prêt pour Vercel.

La base sera volontairement vide : aucun atelier, utilisateur, créneau, crédit ou réservation de démonstration ne sera inséré.

## 1. Reprendre fidèlement le design Stitch
- Transformer la palette Stitch en tokens sémantiques : terracotta principal `#9E412F`, vert atelier, sable chaud, surfaces et états fonctionnels.
- Charger Plus Jakarta Sans et Space Grotesk dans l’en-tête du document.
- Appliquer des rayons de 8 à 12 px aux boutons, champs et menus ; conserver les rayons plus larges prévus par Stitch pour les cartes.
- Reproduire les espacements, grilles, typographies, bordures, ombres et proportions des maquettes, sans copier le script Tailwind CDN du ZIP.
- Récupérer les photos distantes utilisées par Stitch dans le flux d’assets du projet afin d’éviter les liens Google temporaires.
- Remplacer les scripts et icônes Material Symbols par des composants React et Lucide cohérents.

## 2. Construire les trois expériences et leurs 16 écrans

### Parcours public
- Accueil découverte `/`
- Recherche et filtres `/ateliers`
- Fiche atelier et sélection de créneau `/ateliers/$workshopId`
- Présentation artisan `/devenir-artisan`

### Parcours élève
- Connexion `/connexion`
- Création de compte en étapes `/inscription`
- Accueil membre `/espace-eleve`
- Réservations `/espace-eleve/reservations`
- Profil et crédits `/espace-eleve/profil`
- Confirmation de réservation `/reservation/confirmation`

### Parcours artisan
- Candidature `/devenir-artisan/candidature`
- Connexion `/artisan/connexion`
- Planning `/artisan/planning`
- Détail d’une session `/artisan/sessions/$sessionId`
- Ateliers `/artisan/ateliers`
- Revenus `/artisan/revenus`

Chaque page aura son propre titre, sa description et ses métadonnées de partage. Les navigations public, élève et artisan seront isolées dans des structures adaptées à leurs usages.

## 3. Rendre l’expérience réellement mobile-first
- Transformer les en-têtes desktop en navigation compacte utilisable au pouce.
- Remplacer la barre latérale artisan par une navigation mobile adaptée sur petit écran.
- Faire défiler horizontalement les filtres, dates et vues calendrier lorsque nécessaire.
- Préserver des zones tactiles confortables, des textes lisibles et des mises en page sans chevauchement de 320 px aux grands écrans.
- Vérifier les principaux écrans sur mobile et desktop avec des captures de rendu.

## 4. Ajouter les interactions attendues
- Recherche, filtres, tris et catégories synchronisés avec l’URL.
- Choix d’un créneau, quantité de places et récapitulatif avant réservation.
- Formulaires de connexion, inscription élève et candidature artisan avec validation et retours d’erreur.
- Navigation entre écrans et retours cohérents après connexion ou soumission.
- Calendrier artisan, détail des participants, états vide/chargement/erreur et historique des revenus.
- Micro-interactions discrètes : états pressé/focus, transitions de cartes, menus, filtres, confirmations et respect de la réduction des animations.

## 5. Préparer le schéma Supabase externe, sans aucune donnée initiale
- Produire des migrations versionnées pour les profils, rôles, candidatures artisan, ateliers, médias, créneaux, réservations, comptes de crédits, mouvements de crédits et versements artisan.
- Ne créer qu’un compte d’authentification par personne, avec un rôle élève ou artisan contrôlé côté serveur.
- Ajouter contraintes, index, relations, fonctions transactionnelles et règles d’accès pour protéger les données personnelles et financières.
- Ajouter les droits SQL explicites pour chaque table publique avant l’activation des règles d’accès.
- Permettre la lecture publique uniquement des ateliers et créneaux publiés ; réserver les données privées à leur propriétaire et les vues artisan aux artisans concernés.
- Connecter les lectures et écritures de l’application à Supabase, avec états vides naturels tant que la base ne contient rien.
- N’utiliser ni base Lovable, ni données locales persistantes, ni données fictives injectées au chargement.

## 6. Connexion du projet Supabase
Vous connecterez votre projet Supabase existant depuis **More → Cloud → Already have a Supabase project? Connect it here** dans Lovable. Cette liaison ne peut pas être effectuée directement depuis le chat.

Après la connexion, les migrations pourront être appliquées au projet Supabase choisi. Les clés publiques seront utilisées côté navigateur ; toute clé privilégiée restera exclusivement côté serveur.

## 7. Préparer le déploiement Vercel
- Conserver TanStack Start et son rendu serveur, compatible avec Vercel via Nitro.
- Documenter les variables Vercel nécessaires pour le navigateur et le serveur, sans exposer de clé privilégiée.
- Préparer les URL de retour d’authentification pour le domaine Vercel.
- Vérifier les routes profondes, actualisations, connexions, lectures/écritures et rendu serveur avant mise en production.

## 8. Contrôles finaux
- Vérifier la compilation après chaque ensemble de changements.
- Ajouter des tests ciblés pour les rôles, les droits d’accès, les réservations et les mouvements de crédits.
- Tester les parcours essentiels : création de compte, connexion, recherche vide, candidature, création d’atelier, publication de créneau et réservation.
- Comparer visuellement les écrans avec les captures Stitch disponibles et corriger les écarts importants.

## Détails techniques
- Routage : TanStack Router avec pages publiques et zones protégées séparées.
- Données : TanStack Query et fonctions serveur authentifiées pour les opérations sensibles.
- Formulaires : React Hook Form + Zod.
- Backend : projet Supabase externe, migrations SQL versionnées et politiques RLS.
- Hébergement cible : Vercel, Node.js 22, build TanStack Start/Nitro.
- Migration : un registre de suivi recensera code, schéma, authentification, assets et vérifications ; les données existantes sont explicitement absentes.
