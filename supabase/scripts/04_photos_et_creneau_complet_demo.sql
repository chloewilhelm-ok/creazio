-- Données de démo (exécuté sur Supabase le 23/10/2026).
-- 1. Photos des 10 ateliers de démo, servies depuis public/ateliers/ (textes alternatifs : src/lib/photos-ateliers.ts).
WITH photos(titre, photo) AS (VALUES
  ('Créez votre bague en argent', '/ateliers/bijouterie.jpg'),
  ('Porte-cartes en cuir cousu main', '/ateliers/cuir.jpg'),
  ('Initiation au tissage sur métier', '/ateliers/tissage.jpg'),
  ('Sculptez votre cuillère en bois', '/ateliers/bois.jpg'),
  ('Composez votre terrarium', '/ateliers/terrarium.jpg'),
  ('Reliure japonaise d''un carnet', '/ateliers/reliure.jpg'),
  ('Bougies parfumées naturelles', '/ateliers/bougies.jpg'),
  ('Initiation au vitrail', '/ateliers/vitrail.jpg'),
  ('Pain au levain et viennoiseries', '/ateliers/pain-levain.jpg'),
  ('Brassez votre bière artisanale', '/ateliers/biere.jpg'))
UPDATE public.ateliers a SET photo_url = p.photo
FROM photos p, public.profiles pr
WHERE a.titre = p.titre AND pr.id = a.artisan_id AND pr.email LIKE '%.demo@creazio.fr';

-- 2. Créneau complet pour la démo « Complet » : vitrail du samedi 31/10 à 14 h 30.
-- Aucune réservation n'est créée : places restantes mises à 0 (seulement si personne n'a réservé).
-- Pour revenir en arrière : SET places_restantes = places_ouvertes_creazio.
UPDATE public.sessions SET places_restantes = 0
WHERE id = '12c808bd-6908-4895-8792-25d5244e75c6'
  AND NOT EXISTS (SELECT 1 FROM public.reservations r
                  WHERE r.session_id = '12c808bd-6908-4895-8792-25d5244e75c6' AND r.statut = 'confirmee');
