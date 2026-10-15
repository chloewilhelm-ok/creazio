CREATE OR REPLACE FUNCTION prive.savoir_faire_depuis_libelle(p text)
RETURNS public.savoir_faire LANGUAGE sql IMMUTABLE SET search_path TO '' AS $$
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
$$;
REVOKE ALL ON FUNCTION prive.savoir_faire_depuis_libelle(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role public.role_utilisateur := CASE WHEN meta->>'role' = 'artisan' THEN 'artisan'::public.role_utilisateur ELSE 'eleve'::public.role_utilisateur END;
  v_cp text := nullif(left(regexp_replace(coalesce(meta->>'code_postal', ''), '\D', '', 'g'), 5), '');
  v_principal public.savoir_faire;
BEGIN
  INSERT INTO public.profiles (id, role, prenom, nom, email, adresse_ligne, code_postal, ville, cgu_acceptees_le, confidentialite_acceptee_le)
  VALUES (NEW.id, v_role,
    left(coalesce(nullif(trim(meta->>'prenom'), ''), ''), 100),
    left(coalesce(nullif(trim(meta->>'nom'), ''), ''), 100),
    coalesce(NEW.email, ''),
    nullif(trim(meta->>'adresse_ligne'), ''), v_cp, nullif(trim(meta->>'ville'), ''),
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'artisan' THEN
    BEGIN
      SELECT prive.savoir_faire_depuis_libelle(c) INTO v_principal
      FROM jsonb_array_elements_text(coalesce(meta->'categories', '[]'::jsonb)) c
      WHERE prive.savoir_faire_depuis_libelle(c) IS NOT NULL LIMIT 1;

      INSERT INTO public.artisans (profile_id, nom_commercial, adresse_ligne, code_postal, ville, savoir_faire_principal, statut_candidature)
      VALUES (NEW.id,
        left(coalesce(nullif(trim(meta->>'atelier'), ''), ''), 150),
        coalesce(nullif(trim(meta->>'adresse_ligne'), ''), ''),
        coalesce(v_cp, ''),
        coalesce(nullif(trim(meta->>'ville'), ''), ''),
        coalesce(v_principal, 'poterie_ceramique'::public.savoir_faire),
        'en_attente')
      ON CONFLICT (profile_id) DO NOTHING;

      INSERT INTO public.profil_savoirs_faire (profile_id, savoir_faire)
      SELECT DISTINCT NEW.id, prive.savoir_faire_depuis_libelle(c)
      FROM jsonb_array_elements_text(coalesce(meta->'categories', '[]'::jsonb)) c
      WHERE prive.savoir_faire_depuis_libelle(c) IS NOT NULL
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: fiche artisan non créée pour % : %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;