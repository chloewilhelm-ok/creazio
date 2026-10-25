-- 06 - Ateliers de démo « Lancement prochainement » (PRD F20), dans des savoir-faire peu représentés.
-- Ajoute 3 ateliers (aucun créneau, aucun prix) à des artisans de démo existants : métal (aucun atelier publié
-- aujourd'hui), broderie et calligraphie. Identifiants calculés (md5) : rejouable sans doublon, et
-- l'annulation (en bas) ne retire que ces 3 lignes. Aucune autre ligne n'est modifiée.

INSERT INTO public.ateliers (id, artisan_id, titre, description, savoir_faire, duree_minutes, taille_groupe_max,
  materiel_inclus, adresse_ligne, code_postal, ville, quartier, statut)
SELECT md5('creazio-demo-lancement-' || x.cle)::uuid, p.id, x.titre, x.description, x.savoir_faire::public.savoir_faire,
       x.duree, x.groupe, x.materiel, x.adresse, x.cp, 'Paris', x.quartier, 'lancement_prochain'
FROM (VALUES
  ('metal', 'thomas.roux.demo@creazio.fr', 'Forgez votre couteau de cuisine', 'Chauffez, martelez et affûtez une lame d''acier à la forge, puis montez son manche en bois.', 'metal', 240, 4, 'Acier, manche en bois, équipement de protection', '12 Quai de Jemmapes', '75010', 'Canal Saint-Martin'),
  ('broderie', 'ines.garnier.demo@creazio.fr', 'Broderie contemporaine sur tambour', 'Apprenez les points de base et brodez un motif graphique sur lin, à encadrer dans votre tambour.', 'textile', 150, 8, 'Tambour, lin, fils de coton, aiguilles', '27 Rue de la Folie-Méricourt', '75011', 'Oberkampf'),
  ('calligraphie', 'julien.faure.demo@creazio.fr', 'Calligraphie à la plume', 'Découvrez l''écriture anglaise à la plume et à l''encre, et repartez avec une carte calligraphiée.', 'papier', 120, 8, 'Porte-plume, plumes, encre, papier épais', '5 Rue Saint-Paul', '75004', 'Le Marais')
) AS x(cle, email, titre, description, savoir_faire, duree, groupe, materiel, adresse, cp, quartier)
JOIN public.profiles p ON p.email = x.email
ON CONFLICT (id) DO NOTHING;

SELECT a.titre, a.savoir_faire, ar.nom_commercial, a.statut
FROM public.ateliers a JOIN public.artisans ar ON ar.profile_id = a.artisan_id
WHERE a.id IN (SELECT md5('creazio-demo-lancement-' || c)::uuid FROM unnest(ARRAY['metal', 'broderie', 'calligraphie']) c);

-- ─────────────────────────────────────────────────────────────────────────────
-- ANNULER : copier la ligne ci-dessous (sans « -- ») dans le SQL Editor.
-- DELETE FROM public.ateliers WHERE id IN (SELECT md5('creazio-demo-lancement-' || c)::uuid FROM unnest(ARRAY['metal', 'broderie', 'calligraphie']) c);
