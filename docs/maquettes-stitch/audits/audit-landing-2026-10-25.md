# Rapport d'audit d'accessibilité (WCAG 2.1 & 2.2 — Niveaux AA & AAA)
**Écran audité** : `Creazio - Ateliers d'artisans à Paris` (Landing page élève)  
**Type d'appareil** : Desktop (1440px)  
**Référentiel technique** : WCAG 2.1 & 2.2 / RGAA 4.1  
**Date d'évaluation** : 25 octobre 2026  
**Design System** : Atelier Forest & Terracotta  

---

## 1. Synthèse globale & Score de conformité

| Principe WCAG | Taux de conformité estimé | Statut | Observations majeures |
| :--- | :---: | :---: | :--- |
| **1. Perceptible** | **94 %** | 🟢 Conforme AA / AAA | Ratios de contraste textuels exemplaires (> 11:1), balisage alt majoritaire sur les médias. Des SVGs d'ornement méritent `aria-hidden="true"`. |
| **2. Utilisable** | **82 %** | 🟡 Partiel | Navigation clavier fluide mais absence d'un lien d'évitement (`Skip to main content`) et certains contrôles personnalisés manquent d'anneaux `:focus-visible` natifs distinctifs. |
| **3. Compréhensible** | **90 %** | 🟢 Conforme | Langue du document (`<html lang="fr">`), hiérarchie des niveaux de titres claire, labels explicites. Moteur de recherche à relier formellement via `<label>` / combobox. |
| **4. Robuste** | **75 %** | 🟡 Partiel | Répétition de 6 boutons « Réserver un créneau » identiques hors contexte sonore ; nécessite des `aria-label` descriptifs avec l'intitulé du cours. |

**Score global de conformité estimé : 85 % (WCAG 2.1 niveau AA)**

---

## 2. Analyse détaillée par critère WCAG

### A. Principe 1 : Perceptible

#### 1.1.1 Contenu non textuel (Niveau A)
* **Conforme** : Les visuels d'ateliers et photos d'artisans disposent de textes alternatifs `alt` décrivant l'activité (ex. tournage, travail du cuir, maroquinerie, soufflage).
* **Point d'attention / Recommandation** :
  * Certaines icônes SVG décoratives inline (jetons de crédits, repère de lieu pin, flèches chevron) doivent comporter `aria-hidden="true"` afin d'éviter la vocalisation d'éléments non textuels sans valeur sémantique.
  * Le logo Creazio dans l'en-tête doit comporter un attribut textuel explicite : `alt="Creazio - Retour à l'accueil"`.

#### 1.4.3 Contraste minimum (Niveau AA) & 1.4.6 Contraste renforcé (Niveau AAA)
* **Conforme (100 % AAA / AA)** :
  * Titre principal H1 *Deep Forest* (`#0F3D3A`) sur fond clair (`#FFFEFD`) : **11,92:1** (seuil AAA 3,0:1 dépassé).
  * Textes courants, descriptions et tarifs en *On-Surface* (`#1C1C19`) sur fond blanc : **15,84:1** (seuil AAA 4,5:1 dépassé).
  * Boutons d'action « Réserver un créneau » en *Terracotta Cuit* (`#8F3222`) avec typographie blanche : **7,93:1** (seuil AAA 4,5:1 dépassé).
  * Badges de crédits en pilule (fond `#0F3D3A`, texte `#FAF7F2`) : **11,24:1** (seuil AAA 4,5:1).
  * Ancien tarif barré (« ~~40 crédits~~ » en coquille 70% `#B4BFBB` sur fond `#0F3D3A`) : **6,35:1** (seuil AA 4,5:1 validé).
  * Puces de filtre actives (fond `#0F3D3A`, texte clair) : **11,24:1** ; inactives (`#1C1C19` sur sable `#F2E6D6`) : **11,85:1**.
* **Résultat contraste** : **100 % CONFORME (WCAG AA & AAA)**.

#### 1.4.10 Redimensionnement du texte & Reflow (Niveau AA)
* La mise en page desktop 1440px est fluide, conserve la lisibilité jusqu'à un zoom 200 % sans troncature de texte ni chevauchement des étiquettes de crédits.

---

### B. Principe 2 : Utilisable

#### 2.1.1 Clavier (Niveau A) & 2.1.2 Pas de piège au clavier (Niveau A)
* **Conforme** : L'ordre de tabulation séquentiel suit l'ordre logique de lecture du document (Navigation > Moteur de recherche > Filtres par discipline > Grille d'ateliers > Explications crédits > Pied de page). Aucun piège au clavier détecté.

#### 2.4.1 Contournement des blocs (Niveau A — *Critique*)
* **Non-conforme** : Absence d'un mécanisme de saut direct vers le contenu principal (`Skip navigation link`).
* **Recommandation corrective** :
  * Ajouter un lien d'évitement en haut du `<body>` :
    ```html
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0F3D3A] focus:text-[#FAF7F2] focus:rounded">
      Aller au contenu principal
    </a>
    ```
  * Attribuer `id="main-content"` à la balise `<main>`.

#### 2.4.7 Focus visible (Niveau AA)
* **Partiel** : Les boutons en Terracotta plein et les puces de filtres masquent parfois l'anneau de focus natif du navigateur (`outline: none`) sans toujours redéfinir un contour distinct à fort contraste.
* **Recommandation** :
  * Appliquer sur tous les éléments interactifs : `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D3A] focus-visible:ring-offset-2`.

---

### C. Principe 3 : Compréhensible

#### 3.1.1 Langue de la page (Niveau A)
* **Conforme** : L'attribut `lang="fr"` est déclaré à la racine.

#### 3.3.2 Étiquettes ou instructions (Niveau A)
* **Partiel** : La barre de recherche d'ateliers (Matière & Métier, Quartier de Paris, Quand ?) utilise des libellés affichés dans des cartes interactives. Pour les lecteurs d'écran, ces champs doivent être balisés avec des `<label>` associés ou des attributs ARIA complets (`aria-haspopup="listbox"`, `role="combobox"`).

---

### D. Principe 4 : Robuste

#### 4.1.2 Nom, rôle et valeur (Niveau A — *Point clé*)
* **Problème identifié** : Les 6 cartes d'ateliers présentent chacune un bouton avec le libellé identique « Réserver un créneau ». Pour une personne utilisant la navigation par liste de liens ou de boutons d'un lecteur d'écran (ex. JAWS, NVDA, VoiceOver), l'action est ambiguë sans le contexte visuel de la carte.
* **Recommandation corrective** :
  * Enrichir chaque bouton avec un `aria-label` explicite :
    * `aria-label="Réserver un créneau pour l'atelier Initiation au tour de potier & émaillage"`
    * `aria-label="Réserver un créneau pour l'atelier Façonnage d'un porte-cartes en cuir sellier"`
    * `aria-label="Réserver un créneau pour l'atelier Soufflage de verre d'art à la canne"`
    * `aria-label="Réserver un créneau pour l'atelier Technique de dorure à la feuille d'or"`
    * `aria-label="Réserver un créneau pour l'atelier Création d'un tabouret en noyer massif"`
    * `aria-label="Réserver un créneau pour l'atelier Forge & texturage d'une bague en argent"`

---

## 3. Plan d'actions correctives prioritaires

1. **Priorité 1 (Confort clavier & Lecteurs d'écran)** :
   * Insérer le lien d'évitement `Aller au contenu principal` en début de document.
   * Ajouter les `aria-label` individualisés sur les 6 boutons d'action des ateliers.
   * Baliser les icônes décoratives inline avec `aria-hidden="true"`.
2. **Priorité 2 (Interactions & Focus visible)** :
   * Vérifier et renforcer l'anneau de focus `:focus-visible` (ring 2px avec offset) sur l'ensemble des boutons, sélecteurs et puces de filtres.
   * Associer des étiquettes accessibles `<label>` au sélecteur de recherche en 3 étapes.
