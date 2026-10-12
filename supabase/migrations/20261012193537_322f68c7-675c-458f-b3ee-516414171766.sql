CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role public.role_utilisateur := CASE WHEN meta->>'role' = 'artisan' THEN 'artisan'::public.role_utilisateur ELSE 'eleve'::public.role_utilisateur END;
  v_cp text := nullif(left(regexp_replace(coalesce(meta->>'code_postal', ''), '\D', '', 'g'), 5), '');
BEGIN
  INSERT INTO public.profiles (id, role, prenom, nom, email, adresse_ligne, code_postal, ville, cgu_acceptees_le, confidentialite_acceptee_le)
  VALUES (
    NEW.id,
    v_role,
    left(coalesce(nullif(trim(meta->>'prenom'), ''), ''), 100),
    left(coalesce(nullif(trim(meta->>'nom'), ''), ''), 100),
    coalesce(NEW.email, ''),
    nullif(trim(meta->>'adresse_ligne'), ''),
    v_cp,
    nullif(trim(meta->>'ville'), ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;