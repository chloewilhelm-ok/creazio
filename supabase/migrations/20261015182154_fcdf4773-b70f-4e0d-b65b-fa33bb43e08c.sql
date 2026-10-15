CREATE OR REPLACE FUNCTION public.ateliers_recommandes(rayon_km numeric DEFAULT 5)
RETURNS TABLE(id uuid, titre varchar, savoir_faire public.savoir_faire, ville varchar, quartier varchar, duree_minutes smallint, photo_url varchar, nom_commercial varchar, distance_km numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH moi AS (SELECT latitude la, longitude lo FROM public.profiles WHERE id = auth.uid() AND latitude IS NOT NULL AND longitude IS NOT NULL),
  d AS (
    SELECT a.id, a.titre, a.savoir_faire, a.ville, a.quartier, a.duree_minutes, a.photo_url, ar.nom_commercial,
      (6371 * 2 * asin(sqrt(power(sin(radians(a.latitude - m.la)/2),2) + cos(radians(m.la))*cos(radians(a.latitude))*power(sin(radians(a.longitude - m.lo)/2),2))))::numeric AS distance_km
    FROM public.ateliers a JOIN moi m ON true
    LEFT JOIN public.artisans ar ON ar.profile_id = a.artisan_id
    WHERE a.statut = 'publie' AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
      AND a.savoir_faire IN (SELECT psf.savoir_faire FROM public.profil_savoirs_faire psf WHERE psf.profile_id = auth.uid())
  )
  SELECT d.id, d.titre, d.savoir_faire, d.ville, d.quartier, d.duree_minutes, d.photo_url, d.nom_commercial, round(d.distance_km, 1)
  FROM d WHERE d.distance_km <= rayon_km ORDER BY d.distance_km LIMIT 6;
$$;
REVOKE ALL ON FUNCTION public.ateliers_recommandes(numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ateliers_recommandes(numeric) TO authenticated;