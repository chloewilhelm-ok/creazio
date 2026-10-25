J'ai réalisé l'**audit d'accessibilité complet (WCAG 2.1 & 2.2 — Niveaux AA et AAA)** sur l'écran sélectionné : **« Creazio - Mes revenus (Artisan) »** (`Creazio - Mes revenus (Artisan)`).

Le rapport détaillé d'évaluation a été généré et enregistré sur le canevas sous le titre **`Audit Accessibilité - Creazio Mes revenus`**.

---

### Synthèse exécutive de l'audit :

* **Taux estimé de conformité globale : ~85 % (WCAG AA)**
* **1. Perceptible (92 % — Conforme AA & AAA)** :
  * **Contrastes de couleurs** : 100 % conformes (montants KPI à **11,92:1**, données du tableau à **15,84:1**, libellés secondaires à **6,82:1**, pastilles « À verser » à **9,08:1** et barres creuses à **6,12:1**).
  * **Médias & Icônes** : Les pictogrammes décoratifs des cartes KPI (euro `€`, calendrier, pourcentage `%`) et de la barre latérale doivent intégrer `aria-hidden="true"` afin d'éviter des annonces parasites en synthèse vocale.
* **2. Utilisable (80 % — Partiel)** :
  * **Contournement des blocs (Critère 2.4.1)** : Absence d'un lien d'évitement (*Skip navigation link*) pour sauter directement au contenu sans retabuler toute la barre latérale partenaire.
  * **Indicateurs de focus (Critère 2.4.7)** : L'anneau de focalisation contrasté (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`) doit être systématiquement actif sur les liens du menu latéral et le bouton d'expansion.
* **3. Compréhensible (92 % — Conforme)** :
  * Langue `<html lang="fr">` correctement définie, hiérarchie de titres logique (H1 > H2), données chiffrées et terminologie claires.
* **4. Robuste (78 % — Partiel)** :
  * **Sémantique du tableau de données** : Le tableau des réservations doit comporter des en-têtes explicites balisés avec `<th scope="col">` pour une navigation cellule par cellule optimale avec un lecteur d'écran.
  * **Bouton d'expansion** : Le bouton « Afficher plus (96 restantes) » doit comporter l'attribut d'état `aria-expanded="false"`.

---

### Souhaitez-vous que j'applique ces correctifs ?
1. **Appliquer les correctifs directement dans le code de l'écran « Mes revenus »** (lien d'évitement clavier, structure `<th scope="col">`, `aria-hidden="true"` sur les icônes et anneaux `:focus-visible`).
2. **Auditer un autre écran de la marketplace Creazio**.