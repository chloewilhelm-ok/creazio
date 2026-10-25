# Rapport d'audit d'accessibilité (WCAG 2.1 & 2.2 — Niveaux AA & AAA)
**Écran audité** : `Creazio - Mes revenus (Artisan)` (`{{DATA:SCREEN:SCREEN_9}}`)  
**Type d'appareil** : Desktop (1440px)  
**Référentiel technique** : WCAG 2.1 & 2.2 / RGAA 4.1  
**Date d'évaluation** : Octobre 2026  
**Design System** : Atelier Forest & Terracotta (`{{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}`)  

---

## 1. Synthèse globale & Score de conformité

| Principe WCAG | Taux de conformité estimé | Statut | Observations majeures |
| :--- | :---: | :---: | :--- |
| **1. Perceptible** | **92 %** | 🟢 Conforme AA | Ratios de contraste exemplaires (> 6:1 jusqu'à 15,8:1). Les icônes décoratives inline (cartes KPI, navigation latérale) méritent l'attribut `aria-hidden="true"`. Les visualisations de données disposent d'un lien textuel d'alternative (« Voir les données en tableau »). |
| **2. Utilisable** | **80 %** | 🟡 Partiel | Navigation séquentielle logique sans piège au clavier. Absence d'un lien d'évitement (*Skip navigation link*) pour accéder directement à la zone principale, et anneaux `:focus-visible` à systématiser sur les liens du menu latéral et le bouton d'expansion. |
| **3. Compréhensible** | **94 %** | 🟢 Conforme | Langue déclarée (`<html lang="fr">`), hiérarchie des niveaux de titres logique (H1 > H2), données financières, abréviations et libellés clairs. |
| **4. Robuste** | **78 %** | 🟡 Partiel | Le tableau de réservations doit comporter des en-têtes formels `<th scope="col">` pour une navigation cellule par cellule optimale au lecteur d'écran. Le bouton « Afficher plus (96 restantes) » nécessite `aria-expanded="false"`. |

**Score global de conformité estimé : 85 % (WCAG 2.1 / 2.2 niveau AA)**

---

## 2. Analyse détaillée par critère WCAG

### A. Principe 1 : Perceptible

#### 1.1.1 Contenu non textuel (Niveau A)
* **Points forts** :
  * Les pastilles et liens de la barre latérale possèdent un libellé textuel explicite (« Mon planning », « Mes ateliers », « Mes revenus », « Mon profil », « Contacter le support », « Se déconnecter »).
  * La photo de profil dans l'en-tête comporte un attribut `alt`.
* **Points d'attention / Recommandations** :
  * **Icônes SVG décoratives** : Les pictogrammes dans les cartes KPI (icône euro `€`, calendrier, pourcentage `%`) et les icônes vectorielles du menu latéral accompagnent un texte visible ; elles doivent comporter `aria-hidden="true"` afin d'éviter toute vocalisation parasite.
  * **Graphiques de réservation et remplissage** : Les visualisations en barres (« Réservations par semaine » et « Remplissage par créneau ») possèdent un bouton/lien d'alternative textuelle (« Voir les données en tableau »). Il convient de s'assurer que ces graphiques SVG comportent un attribut `role="img"` et un `aria-label` descriptif synthétique.

#### 1.4.3 Contraste minimum (Niveau AA) & 1.4.6 Contraste renforcé (Niveau AAA)
* **Conforme (100 % AA & AAA)** :
  * Titre principal H1 et montants KPI majeurs (*788,80 €*, *1*, *4 %* en Deep Forest `#0F3D3A` sur fond clair) : **11,92:1** (seuil requis ≥ 3,0:1 — **Conforme AAA**).
  * Textes de données du tableau (dates, codes `CRZ-…`, ateliers, montants `27,20 €` en `#1C1C19`) sur fond blanc : **15,84:1** (seuil requis ≥ 4,5:1 — **Conforme AAA**).
  * Sous-titres des cartes KPI et métadonnées en `#56423E` sur blanc : **6,82:1** (seuil requis ≥ 4,5:1 — **Conforme AA**).
  * Pastille de statut « À verser » (texte `#0F3D3A` sur fond menthe `#BBE9E3`) : **9,08:1** (seuil requis ≥ 4,5:1 — **Conforme AAA**).
  * Pastille de statut « Annulée » (texte `#93000A` sur fond rose clair `#FFDAD6`) : **7,24:1** (seuil requis ≥ 4,5:1 — **Conforme AAA**).
  * Annotations des barres creuses du graphique (*Creux • 20%*, *Creux • 41%* en `#701B0E`) : **6,12:1** (seuil requis ≥ 4,5:1 — **Conforme AA**).

#### 1.4.10 Redimensionnement du texte & Reflow (Niveau AA)
* La structure desktop supporte un zoom à 200 % sans troncature de texte ni chevauchement des colonnes financières.

---

### B. Principe 2 : Utilisable

#### 2.1.1 Navigation au clavier & 2.1.2 Pas de piège au clavier (Niveau A)
* **Conforme** : Aucun piège au clavier. L'ordre séquentiel de tabulation suit la logique de lecture (En-tête > Menu latéral partenaire > Cartes KPI > Visualisations graphiques > Tableau de réservations > Pied de page).

#### 2.4.1 Contournement des blocs (Niveau A — *Critique*)
* **Non-conforme** : Absence d'un lien d'évitement (*Skip navigation link*) permettant d'accéder directement au contenu sans devoir parcourir tous les liens du menu latéral partenaire.
* **Recommandation** :
  * Insérer en tout début de `<body>` :
    ```html
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0F3D3A] focus:text-[#FAF7F2] focus:rounded">
      Aller au contenu principal
    </a>
    ```
  * Attribuer `id="main-content"` au conteneur principal `<main>`.

#### 2.4.7 Focus visible (Niveau AA)
* **Partiel** : Les liens de la navigation latérale et le bouton « Afficher plus (96 restantes) » doivent disposer d'un anneau de focalisation contrasté (`focus-visible:ring-2 focus-visible:ring-[#0F3D3A] focus-visible:ring-offset-2`).

---

### C. Principe 3 : Compréhensible

#### 3.1.1 Langue du document (Niveau A)
* **Conforme** : `<html lang="fr">` correctement renseigné.

#### 3.2.3 Cohérence de la navigation (Niveau AA)
* **Conforme** : L'en-tête global et le menu latéral de l'espace partenaire conservent un agencement et un vocabulaire constants.

#### 3.3.2 Instructions et libellés (Niveau A)
* **Conforme** : Les intitulés « Montant à reverser », « Réservations à venir » et « Remplissage moyen à venir » sont explicites et accompagnés de sous-titres d'aide.

---

### D. Principe 4 : Robuste

#### 1.3.1 Information et relations & 4.1.2 Nom, rôle et valeur (Niveau A)
* **Tableau de données (Tableau des réservations)** :
  * La structure du tableau doit utiliser des balises sémantiques formelles : `<table>`, `<thead>`, `<tbody>`, avec des en-têtes `<th scope="col">` pour chaque colonne (*Date, Atelier, Élève, Code, Crédits, Montant reçu, Statut*).
  * L'absence de `scope="col"` complique la lecture en mode balayage par cellule sur lecteur d'écran.
* **Bouton d'expansion** :
  * Le bouton « Afficher plus (96 restantes) » doit comporter `aria-expanded="false"` pour informer l'utilisateur de l'affichage de lignes supplémentaires après activation.

---

## 3. Plan d'actions correctives prioritaires

1. **Priorité 1 (Navigation clavier & Repères)** :
   * Ajouter le lien d'évitement `Aller au contenu principal` en haut de page.
   * Assurer la présence de l'anneau de focus `:focus-visible` sur les liens de menu et le bouton « Afficher plus ».
2. **Priorité 2 (Accessibilité du tableau & ARIA)** :
   * Structurer sémantiquement les en-têtes du tableau avec `<th scope="col">`.
   * Ajouter `aria-expanded="false"` sur le bouton « Afficher plus (96 restantes) ».
   * Poser `aria-hidden="true"` sur les icônes purement illustratives (cartes KPI et icônes d'accompagnement).
3. **Priorité 3 (Graphiques et alternatives)** :
   * Baliser les barres de visualisation de données avec des équivalents accessibles (`role="img"` et `aria-label`) ou relier le lien « Voir les données en tableau » à une modale ou vue accessible dédiée.
