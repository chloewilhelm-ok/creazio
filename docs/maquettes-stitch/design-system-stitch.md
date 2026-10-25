---
name: Atelier Forest & Terracotta
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#56423e'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#89726d'
  outline-variant: '#dcc0bb'
  surface-tint: '#9e412f'
  primary: '#7f2a1a'
  on-primary: '#ffffff'
  primary-container: '#9e412f'
  on-primary-container: '#ffcdc3'
  inverse-primary: '#ffb4a5'
  secondary: '#3b6662'
  on-secondary: '#ffffff'
  secondary-container: '#bbe9e3'
  on-secondary-container: '#3f6a66'
  tertiary: '#614000'
  on-tertiary: '#ffffff'
  tertiary-container: '#7b5819'
  on-tertiary-container: '#ffd18d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0400'
  on-primary-fixed-variant: '#7f2a1a'
  secondary-fixed: '#beebe6'
  secondary-fixed-dim: '#a2cfca'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#224e4a'
  tertiary-fixed: '#ffddaf'
  tertiary-fixed-dim: '#eebf76'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  # Creazio : boutons et champs à 8px (DEFAULT), encadrés à 12px (md), cartes à 16px (lg).
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

Le système de design est conçu pour une plateforme de réservation d'ateliers d'artisans par crédits, implantée dans le paysage créatif parisien (poterie, travail du cuir, dorure, menuiserie d'art, verrerie). Il concilie la flexibilité servicielle d'un abonnement moderne avec la noblesse tactile du fait-main.

L'esthétique fusionne un **minimalisme éditorial chaleureux** et une **sensibilité organique d'atelier** :
- **Atmosphère minérale et texturée** : les fonds sables et terres cuites enveloppent l'expérience dans un climat calme, dépouillé de toute agressivité numérique.
- **Rigueur d'atelier d'art** : des découpes nettes, un équilibre d'espaces calmes et une assise typographique contrastée traduisent le geste précis de l'artisan.
- **Sobriété fonctionnelle** : l'interface valorise l'artisanat par le vide et la composition, sans fioritures superflues, pensée pour une navigation desktop 1440px aérée et engageante.

## Colors

La palette chromatique est tirée des matières premières de l'atelier parisien : argile brute, bois dense, feuillage d'hiver et reflets d'outils en laiton :

- **Primaire (`#8F3222` - Terracotta Cuit)** : Incarnation de l'énergie créative et de la terre cuite. Utilisée pour les actions déterminantes (réservation de créneau, achat de packs de crédits, jauges de progression). Teinte assombrie depuis le Terracotta Clay d'origine (`#E0745E`) pour l'accessibilité : texte blanc à **7,93:1** (WCAG AAA) contre 3,08:1 pour `#E0745E`, qui échouait au niveau AA (4,5:1). `#E0745E` reste réservé aux éléments décoratifs sans texte (illustrations, fonds de pastilles).
- **Secondaire (`#0F3D3A` - Deep Forest)** : Évoque les tabliers d'atelier, l'ébénisterie et le cuir végétal. Employée pour la typographie de haut niveau, les headers structurants et les badges d'artisans vérifiés.
- **Tertiaire (`#F4B13B` - Laiton Solaire)** : Ponctuation chaude rappelant le poinçon d'or et les finitions métalliques. Réservée aux soldes de crédits, aux créneaux en forte demande et aux certifications de maîtres artisans.
- **Neutre (`#FFFEFD` - Blanc Coquille)** : Toile de fond continue, très légèrement chaude, relayée par `#F2E6D6` (Sable Chaleureux) pour les blocs d'élévation intermédiaire et `#FFFFFF` pour les conteneurs d'interaction directe, délimités par leur bordure. Éclaircie depuis `#FAF7F2` pour une page plus lumineuse.
- **Pastilles de savoir-faire** : `#F2E6D6` (sable), `#BBE9E3` (menthe), `#FFDDAF` (abricot), `#FFDAD3` (rose argile), avec icône Deep Forest (contraste de 9,1 à 9,8:1).

## Typography

Le système typographique combine l'accueil chaleureux de **Plus Jakarta Sans** et la technicité d'atelier de **Space Grotesk** :

- **Titres et récits (`Plus Jakarta Sans`)** : Utilisés du H1 au corps de texte pour conférer une voix humaine, fluide et élégante. Les titres s'expriment en teintes sombres (`#0F3D3A`) pour installer un ancrage visuel immédiat.
- **Comptage et spécifications d'atelier (`Space Grotesk`)** : Consacré aux données précises du service : montants de crédits (ex: `4 CRÉDITS`), durées d'ateliers, jauges de places restantes, adresses dans Paris et filtres par matière.

## Layout & Spacing

Le gabarit desktop est optimisé pour une largeur standard de **1440px** avec une grille fluide à 12 colonnes contenue dans un max-width de 1360px :

- **Desktop (1440px)** : Marges extérieures de `3rem` (48px) et gouttières de `1.5rem` (24px). L'espace négatif généreux (`space-xl`) isole les ateliers phares et laisse respirer la photographie artisanale.
- **Tablette (768px - 1024px)** : 8 colonnes, marges de `2rem`, gouttières de `1.25rem`.
- **Mobile (< 768px)** : 4 colonnes, marges resserrées à `1.25rem`, gouttières de `1rem`. Les filtres et sélecteurs de dates adoptent un défilement horizontal discret sans masquer la page.

## Elevation & Depth

Le principe de profondeur repose sur un étagement tactile et minéral évitant les ombres synthétiques lourdes :

- **Superposition des plans** : Le fond de page `#FFFEFD` accueille des conteneurs d'ateliers en `#FFFFFF` ou des blocs d'informations secondaires en `#F2E6D6`.
- **Ombres d'ambiance patinées** : Les surfaces interactives (cartes d'ateliers survolées, modales de réservation) utilisent une ombre douce infusée de teintes végétales et terracotta : `box-shadow: 0 12px 32px -8px rgba(15, 61, 58, 0.08), 0 4px 12px -2px rgba(224, 116, 94, 0.06)`.
- **Filets de matière** : Délimitation géométrique précise via une bordure ténue de `1px solid rgba(15, 61, 58, 0.12)` assurant la lisibilité sans alourdir le regard.

## Shapes

La géométrie des interfaces traduit la rondeur d'un tour de potier ou le chanfreinage du bois poli :

- **Composants d'action standard** : Rayon de courbure de `0.5rem` (**8px**) pour tous les boutons, champs et menus déroulants, sans exception (en-tête compris).
- **Encadrés et messages** : `0.75rem` (12px) pour les blocs d'information, messages d'erreur ou de confirmation et sélecteurs de créneaux.
- **Cartes et conteneurs d'atelier** : Rayon de `1rem` (16px) pour adoucir les blocs d'images et encadrer la mise en scène des métiers d'art.
- **Jetons et indicateurs de crédits** : Formes en pilule (`full`) garantissant un repérage immédiat des badges tarifaires et filtres thématiques.

## Components

### Cartes d'Atelier (Workshop Cards)
- Fond `#FFFFFF`, bordure fine `1px solid rgba(15, 61, 58, 0.08)`, coins arrondis à 16px.
- En-tête photo pleine largeur en ratio 4:3 mettant en valeur le geste de l'artisan, rehaussée d'un badge de crédits flottant en haut à droite.
- Au survol : translation verticale subtile (-2px) et intensification délicate de l'ombre d'ambiance.

### Badge de Crédits (Credit Token)
- Format pilule (`rounded-full`), fond Deep Forest (`#0F3D3A`), typographie Space Grotesk en blanc coquille (`#FAF7F2`) ; seule l'icône de jeton reste en doré solaire (`#F4B13B`). Le texte doré sur vert était jugé peu lisible sur photo.
- Ancien prix : barré, juste avant le prix réel, en coquille à 70 % (« dès ~~40~~ 32 crédits »), toujours exprimé en crédits, jamais en euros.
- Version alternative "solde utilisateur" : fond `#FAF7F2`, bordure dorée, affichant l'icône de jeton et le nombre restant.

### Boutons
- **Primary (Réserver / Confirmer)** : Fond plein Terracotta Cuit (`#8F3222`), texte blanc (7,93:1), coins arrondis à 8px, typographie Plus Jakarta Sans semibold. Au survol : fond à 90 % d'opacité (`#9A4638`, texte blanc à 6,35:1).
- **Secondary (Découvrir l'artisan, Retour, Annuler)** : Fond transparent, bordure 1.5px Deep Forest (`#0F3D3A`), typographie Deep Forest, coins arrondis à 8px. Survol sur fond `#F2E6D6`.
- **Même gabarit pour tous** : primaire et secondaire partagent hauteur, police et arrondi ; seule la couleur change. Pas de bouton rouge : une action d'annulation (« Oui, annuler ») reste un bouton primaire, son libellé suffit à l'identifier.
- **Tertiary (Action rapide)** : Fond Laiton Solaire (`#F4B13B`), texte Deep Forest (`#0F3D3A`, contraste 6,4:1), réservé aux offres éclairs et aux réapprovisionnements de crédits.
- **Étiquette de changement d'univers** (« Espace artisans » sur le site élève, « Espace élève » sur le site artisan) : pilule fond `#FFF6E0`, bordure 1px `#F4B13B`, texte Deep Forest en poids normal (11,2:1).

### Filtres & Chips
- Puces en pilule (`rounded-full`, 36px de haut), Space Grotesk 12px semibold, fond `#F2E6D6` et texte `#1C1C19` ; survol abricot `#FFDDAF`.
- État actif : fond plein Deep Forest (`#0F3D3A`), texte `#FAF7F2`, témoignant d'un choix affirmé de matière ou de quartier parisien.

### Champs de Saisie & Sélecteurs de Créneaux
- Fond neutre chaud `#FAF7F2`, bordure 1px `rgba(15, 61, 58, 0.15)`, coins arrondis à **8px** (champs d'une ligne comme zones de texte).
- État focus : contour Deep Forest net assorti d'un halo doux Terracotta (`0 0 0 3px rgba(224, 116, 94, 0.25)`). Labels en Space Grotesk semibold 14px.
- Erreur de saisie : message sous le champ en `#BA1A1A` (6,41:1), relié au champ (`aria-describedby`), bordure du champ dans la même couleur.

### Jauge de Disponibilité (Seat Counter)
- Micro-composant placé sous l'horaire de l'atelier : barre fine de 4px, fond sable avec remplissage Terracotta proportionnel aux places restantes ; texte « Plus qu'une place », « Plus que 2 places », sinon « 4 places disponibles », en Space Grotesk.

### Messages
- **Erreur** : encadré fond `#FFDAD6` (error-container), texte `#93000A` (7,24:1), arrondi 12px, rôle `alert`.
- **Confirmation** : encadré fond menthe `#BBE9E3`, texte Deep Forest (9,08:1), rôle `status`.

### Chiffres
- Montants de crédits, durées, horaires, places, codes de réservation (`CRZ-…`), soldes et indicateurs du dashboard en **Space Grotesk** (classe `label-font`) ; le texte courant reste en Plus Jakarta Sans.

## Mise en œuvre dans le code

Les couleurs ci-dessus sont déclarées en oklch dans `src/styles.css` (variables `--primary`, `--secondary` = Deep Forest, `--background`, `--laiton`, `--deep-forest`, `--sable`, `--menthe`, `--abricot`, `--rose-argile`, `--coquille` pour le fond des champs, `--destructive` / `--erreur-fond` / `--erreur-texte` pour les erreurs ; arrondi de base `--radius: 0.5rem`, et utilitaires d'ombre `shadow-patine` / `shadow-patine-forte`) et exposées en classes Tailwind (`bg-laiton`, `text-deep-forest`…). Les jetons de l'en-tête de ce fichier (`colors:`) sont l'export d'origine de Stitch ; en cas d'écart, les valeurs des sections ci-dessus et de `src/styles.css` font foi.

| Rôle | Valeur appliquée | Contraste vérifié |
|---|---|---|
| Bouton principal | `#8F3222`, texte blanc | 7,93:1 (AAA) |
| Bouton principal au survol | `#9A4638`, texte blanc | 6,35:1 (AA) |
| Étiquette « Espace artisans » / « Espace élève » | fond `#FFF6E0`, bordure `#F4B13B`, texte `#0F3D3A` | 11,2:1 (AAA) |
| Badge de crédits | `#FAF7F2` sur `#0F3D3A` | 11,24:1 (AAA) |
| Ancien prix barré du badge | coquille 70 % (`#B4BFBB`) sur `#0F3D3A` | 6,35:1 (AA) |
| Puce de filtre active | `#FAF7F2` sur `#0F3D3A` | 11,24:1 (AAA) |
| Message d'erreur | `#93000A` sur `#FFDAD6` | 7,24:1 (AAA) |
| Erreur sous un champ | `#BA1A1A` sur `#FFFEFD` | 6,41:1 (AA) |
| Confirmation | `#0F3D3A` sur `#BBE9E3` | 9,08:1 (AAA) |
| Solde de crédits (en-tête) | `#0F3D3A` sur `#FAF7F2`, bordure `#F4B13B` | 11,24:1 (AAA) |
| Titres | `#0F3D3A` sur `#FFFEFD` | 11,92:1 (AAA) |
| Pastilles de savoir-faire | 4 teintes claires, icône `#0F3D3A` | 9,08 à 9,76:1 (AAA) |
