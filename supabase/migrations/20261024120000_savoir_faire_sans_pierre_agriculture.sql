-- M5 - Savoir-faire : retrait de « pierre » et « agriculture », absents du catalogue du site.
-- Aucune ligne ne les utilise (vérifié avant migration). Postgres ne permet pas de retirer une valeur d'une
-- énumération : on recrée le type avec les 12 valeurs du catalogue, on y bascule les 3 colonnes, puis on
-- réinstalle les 2 fonctions qui en dépendent, à l'identique. Une valeur retirée encore présente ferait échouer
-- la conversion, et donc toute la migration.

ALTER TYPE public.savoir_faire RENAME TO savoir_faire_avant_m5;
CREATE TYPE public.savoir_faire AS ENUM (
  'poterie_ceramique', 'textile', 'bois', 'vegetal', 'papier', 'cosmetique_bien_etre',
  'bijouterie', 'metal', 'cuir', 'verre', 'a_manger', 'a_boire'
);

DROP FUNCTION public.ateliers_recommandes(numeric);
DROP FUNCTION prive.savoir_faire_depuis_libelle(text);

ALTER TABLE public.ateliers ALTER COLUMN savoir_faire TYPE public.savoir_faire USING savoir_faire::text::public.savoir_faire;
ALTER TABLE public.artisans ALTER COLUMN savoir_faire_principal TYPE public.savoir_faire USING savoir_faire_principal::text::public.savoir_faire;
ALTER TABLE public.profil_savoirs_faire ALTER COLUMN savoir_faire TYPE public.savoir_faire USING savoir_faire::text::public.savoir_faire;

DROP TYPE public.savoir_faire_avant_m5;

-- Fonctions réinstallées à l'identique (définitions relevées sur la base avant migration)
CREATE FUNCTION prive.savoir_faire_depuis_libelle(p text)
RETURNS public.savoir_faire LANGUAGE sql IMMUTABLE SET search_path TO '' AS $function$
  SELECT CASE p
    WHEN 'Poterie et Céramique' THEN 'poterie_ceramique'
    WHEN 'À manger' THEN 'a_manger'
    WHEN 'Textile' THEN 'textile'
    WHEN 'Bois' THEN 'bois'
    WHEN 'À boire' THEN 'a_boire'
    WHEN 'Végétal' THEN 'vegetal'
    WHEN 'Papier' THEN 'papier'
    WHEN 'Bien-être' THEN 'cosmetique_bien_etre'
    WHEN 'Bijouterie' THEN 'bijouterie'
    WHEN 'Métal' THEN 'metal'
    WHEN 'Cuir' THEN 'cuir'
    WHEN 'Verre' THEN 'verre'
    ELSE NULL END::public.savoir_faire
$function$;
REVOKE ALL ON FUNCTION prive.savoir_faire_depuis_libelle(text) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.ateliers_recommandes(rayon_km numeric DEFAULT 5)
RETURNS TABLE(id uuid, titre character varying, savoir_faire public.savoir_faire, ville character varying, quartier character varying,
  duree_minutes smallint, photo_url character varying, nom_commercial character varying, distance_km numeric)
LANGUAGE sql STABLE SET search_path TO '' AS $function$
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
$function$;
REVOKE ALL ON FUNCTION public.ateliers_recommandes(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ateliers_recommandes(numeric) TO authenticated, service_role;
