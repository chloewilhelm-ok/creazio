-- M5 - Inscription élève : consentements RGPD horodatés au clic et accord newsletter.
-- Avant : le trigger handle_new_user datait l'acceptation des CGU et de la politique de confidentialité
-- avec now(), c'est-à-dire l'heure de création du compte, pas celle du clic sur la case.
-- Après : il reprend l'heure du clic transmise par le formulaire (raw_user_meta_data), bornée aux
-- dernières 24 h pour qu'une date inventée ne puisse pas être enregistrée ; sans heure valide, now().

-- 1. Accord newsletter : vide = pas d'accord.
ALTER TABLE public.profiles ADD COLUMN newsletter_acceptee_le timestamptz;
COMMENT ON COLUMN public.profiles.newsletter_acceptee_le IS
  'Date de l''accord pour recevoir la sélection hebdomadaire d''ateliers ; NULL = pas d''accord.';

-- 2. Lecture prudente d'une heure de consentement venue du navigateur.
CREATE FUNCTION prive.horodatage_consentement(p text)
RETURNS timestamptz LANGUAGE plpgsql STABLE SET search_path TO '' AS $function$
DECLARE
  v timestamptz;
BEGIN
  IF p IS NULL OR trim(p) = '' THEN RETURN NULL; END IF;
  v := p::timestamptz;
  IF v > now() OR v < now() - interval '1 day' THEN RETURN now(); END IF;
  RETURN v;
EXCEPTION WHEN OTHERS THEN
  RETURN now();
END;
$function$;
REVOKE ALL ON FUNCTION prive.horodatage_consentement(text) FROM PUBLIC, anon, authenticated, service_role;

-- 3. Trigger de création du profil : identique à la version en place, sauf les 3 dates de consentement.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role public.role_utilisateur := CASE WHEN meta->>'role' = 'artisan' THEN 'artisan'::public.role_utilisateur ELSE 'eleve'::public.role_utilisateur END;
  v_cp text := nullif(left(regexp_replace(coalesce(meta->>'code_postal', ''), '\D', '', 'g'), 5), '');
  v_principal public.savoir_faire;
BEGIN
  INSERT INTO public.profiles (id, role, prenom, nom, email, adresse_ligne, code_postal, ville,
    cgu_acceptees_le, confidentialite_acceptee_le, newsletter_acceptee_le)
  VALUES (NEW.id, v_role,
    left(coalesce(nullif(trim(meta->>'prenom'), ''), ''), 100),
    left(coalesce(nullif(trim(meta->>'nom'), ''), ''), 100),
    coalesce(NEW.email, ''),
    nullif(trim(meta->>'adresse_ligne'), ''), v_cp, nullif(trim(meta->>'ville'), ''),
    coalesce(prive.horodatage_consentement(meta->>'cgu_acceptees_le'), now()),
    coalesce(prive.horodatage_consentement(meta->>'confidentialite_acceptee_le'), now()),
    prive.horodatage_consentement(meta->>'newsletter_acceptee_le'))
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

-- 4. Abonnement / désabonnement depuis « Mon profil » : la date est celle du serveur, jamais celle du
-- navigateur. Se réabonner après un désabonnement enregistre une nouvelle date.
CREATE FUNCTION public.definir_newsletter(p_abonne boolean)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_date timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NON_CONNECTE: connexion requise'; END IF;
  UPDATE public.profiles
     SET newsletter_acceptee_le = CASE WHEN p_abonne THEN coalesce(newsletter_acceptee_le, now()) END
   WHERE id = auth.uid()
  RETURNING newsletter_acceptee_le INTO v_date;
  IF NOT FOUND THEN RAISE EXCEPTION 'NON_CONNECTE: profil introuvable'; END IF;
  RETURN v_date;
END;
$function$;
REVOKE ALL ON FUNCTION public.definir_newsletter(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_newsletter(boolean) TO authenticated, service_role;
