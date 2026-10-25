J'ai effectué l'audit d'accessibilité complet selon les référentiels **WCAG 2.1 & 2.2 (niveaux AA et AAA)** sur l'écran sélectionné : **« Creazio - Ateliers d'artisans à Paris »** (`Creazio - Ateliers d'artisans à Paris`).

Le rapport d'audit exhaustif a été actualisé et consigné dans le document : **`Audit Accessibilité - Creazio Landing Page (25 oct 2026)`**.

---

### Synthèse exécutive de l'audit :

* **Taux estimé de conformité globale : ~85 % (WCAG AA)**
* **1. Perceptible (94 % — Conforme AA & AAA)** :
  * **Contrastes de couleurs** : 100 % conformes (ratios textuels H1 et corps de texte à **11,92:1** et **15,84:1** ; boutons d'action *Terracotta Cuit* à **7,93:1** ; badges de crédits à **11,24:1** et anciens prix barrés à **6,35:1**).
  * **Images & Médias** : Les photos principales des ateliers disposent d'attributs `alt`. Recommandation d'ajouter `aria-hidden="true"` sur les micro-icônes SVG purement décoratives (jetons, chevrons).
* **2. Utilisable (82 % — Partiel)** :
  * **Contournement des blocs (Critère 2.4.1)** : Absence d'un lien d'évitement (*Skip to main content*) pour les utilisateurs navigant au clavier.
  * **Indicateurs de focus (Critère 2.4.7)** : Les états `:focus-visible` nécessitent un anneau de focalisation contrasté (`ring-2 ring-primary ring-offset-2`) sur les puces de filtres et les boutons.
* **3. Compréhensible (90 % — Conforme)** :
  * Déclaration de langue `<html lang="fr">` respectée, hiérarchie de titrage claire (H1, H2, H3).
  * Les 3 sélecteurs du formulaire rapide méritent d'être formalisés avec des `<label>` associés ou des attributs ARIA complets (`role="combobox"`).
* **4. Robuste (75 % — Partiel)** :
  * **Rôle & Intitulé (Critère 4.1.2)** : Les 6 cartes d'ateliers comportent des boutons au libellé identique « Réserver un créneau ». L'ajout d'un `aria-label` contextualisé par cours (ex. *« Réserver un créneau pour l'Initiation au tour de potier »*) permettra d'assurer une compréhension immédiate pour les utilisateurs de lecteurs d'écran.

---

### Souhaitez-vous que j'applique ces correctifs ?
1. **Appliquer les correctifs d'accessibilité prioritaires directement dans le code HTML de la landing page** (lien d'évitement, anneaux `:focus-visible`, `aria-label` sur les 6 boutons, et `aria-hidden` sur les icônes).
2. **Étendre l'audit d'accessibilité aux autres écrans** (fiche atelier ou dashboard artisan « Mes revenus »).