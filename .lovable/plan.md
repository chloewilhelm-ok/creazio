# Plan de transformation de Creazio

## Objectif
Recréer les 16 maquettes Stitch en application React 19 + TypeScript + Tailwind CSS v4, avec une navigation complète, des interactions utiles, une architecture mobile-first et une intégration prête à accueillir votre futur backend Supabase externe sur Vercel.

La base sera volontairement vide : aucun atelier, utilisateur, créneau, crédit ou réservation de démonstration ne sera inséré.

## 1. Reprendre fidèlement le design Stitch
- Transformer la palette Stitch en tokens sémantiques : terracotta principal `#9E412F`, vert atelier, sable chaud, surfaces et états fonctionnels.
- Charger Plus Jakarta Sans et Space Grotesk dans l’en-tête du document.
- Appliquer des rayons de 8 à 12 px aux boutons, champs et menus ; conserver les rayons plus larges prévus par Stitch pour les cartes.
- Reproduire les espacements, grilles, typographies, bordures, ombres et proportions des maquettes, sans copier le script Tailwind CDN du ZIP.
- Récupérer les photos distantes utilisées par Stitch dans le flux d’assets du projet afin d’éviter les liens Google temporaires.
- Remplacer les scripts et icônes Material Symbols par des composants React et Lucide cohérents.

## 2. Construire les trois expériences et leurs 16 écrans

### Parcours public — accessible sans connexion
- Accueil découverte `/`

### Parcours élève
- Connexion `/connexion`
- Création de compte en étapes `/inscription`
- Recherche et filtres `/ateliers`
- Fiche atelier et sélection de créneau `/ateliers/$workshopId`
- Accueil membre `/espace-eleve`
- Réservations `/espace-eleve/reservations`
- Profil et crédits `/espace-eleve/profil`
- Confirmation de réservation `/reservation/confirmation`

### Parcours artisan
- Présentation artisan `/devenir-artisan`
- Candidature `/devenir-artisan/candidature`
- Connexion `/artisan/connexion`
- Planning `/artisan/planning`
- Détail d’une session `/artisan/sessions/$sessionId`
- Ateliers `/artisan/ateliers`
- Revenus `/artisan/revenus`

Chaque page aura son propre titre, sa description et ses métadonnées de partage. Seule la page d’accueil `/` sera consultable sans compte. La recherche, les fiches atelier, la réservation, la présentation/candidature artisan et les espaces membres seront protégés par connexion, avec séparation des accès élève et artisan selon le rôle. Les navigations public, élève et artisan seront isolées dans des structures adaptées à leurs usages.

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

## 5. Préparer l’application pour votre futur backend Supabase
- Ne créer aucune architecture de base de données, table, migration, donnée ou règle RLS : vous réaliserez cette partie directement dans Supabase dans un second temps.
- Structurer les écrans, types et accès aux données derrière une couche d’adaptation claire afin de pouvoir les connecter ensuite à votre schéma sans refaire l’interface.
- Fournir des états vides, de chargement et d’erreur adaptés aux futurs ateliers, créneaux, réservations, crédits et revenus.
- Rendre les formulaires et parcours interactifs côté interface, sans prétendre persister les actions tant que votre schéma Supabase n’existe pas.
- N’utiliser ni backend Lovable, ni stockage local persistant, ni données fictives injectées au chargement.

## 6. Connexion ultérieure du projet Supabase
Une fois votre architecture, vos tables et vos règles RLS créées, vous connecterez votre projet Supabase existant depuis **More → Cloud → Already have a Supabase project? Connect it here** dans Lovable. Cette liaison ne peut pas être effectuée directement depuis le chat.

À ce moment-là, l’application pourra être raccordée précisément à votre schéma. Les clés publiques seront utilisées côté navigateur ; toute clé privilégiée restera exclusivement côté serveur.

## 7. Préparer le déploiement Vercel
- Conserver TanStack Start et son rendu serveur, compatible avec Vercel via Nitro.
- Documenter les emplacements des futures variables Vercel nécessaires pour le navigateur et le serveur, sans exiger de clés tant que Supabase n’est pas raccordé.
- Préparer les URL de retour d’authentification pour le domaine Vercel.
- Vérifier les routes profondes, actualisations, connexions, lectures/écritures et rendu serveur avant mise en production.

## 8. Contrôles finaux
- Vérifier la compilation après chaque ensemble de changements.
- Ajouter des tests ciblés pour la navigation, les validations de formulaires et les interactions d’interface.
- Tester les parcours d’interface essentiels : création de compte, connexion, recherche vide, candidature, sélection de créneau et confirmation.
- Comparer visuellement les écrans avec les captures Stitch disponibles et corriger les écarts importants.

## Détails techniques
- Routage : TanStack Router avec pages publiques et zones protégées séparées.
- Données : contrats TypeScript et couche d’adaptation prête pour TanStack Query lors du raccordement futur.
- Formulaires : React Hook Form + Zod.
- Backend : hors périmètre de cette phase ; schéma et sécurité seront créés ultérieurement par vos soins dans Supabase.
- Hébergement cible : Vercel, Node.js 22, build TanStack Start/Nitro.
- Migration : un registre de suivi recensera code, écrans, assets et vérifications ; le backend et les données sont explicitement différés.
