-- M5 - Alerte email à chaque nouvelle candidature artisan.
-- À l'insertion d'une candidature « en_attente », la base appelle l'Edge Function alerter-nouvelle-candidature
-- (pg_net), qui écrit à contact@creazio.fr avec Resend. La colonne alerte_candidature_envoyee_le sert de verrou :
-- un seul email par candidature. Un échec d'appel est journalisé et ne bloque jamais l'inscription.
-- La colonne n'est accessible à aucun utilisateur (pas de droit de colonne pour authenticated). Idempotent.

ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS alerte_candidature_envoyee_le timestamptz;
COMMENT ON COLUMN public.artisans.alerte_candidature_envoyee_le IS
  'Date d''envoi de l''alerte « nouvelle candidature » à contact@creazio.fr (verrou : un seul email par candidature).';

CREATE OR REPLACE FUNCTION prive.alerter_nouvelle_candidature()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://fljqrpshvlldtuseoogb.supabase.co/functions/v1/alerter-nouvelle-candidature',
      body := jsonb_build_object('profile_id', NEW.profile_id),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 10000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'alerter_nouvelle_candidature: appel impossible pour % : %', NEW.profile_id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION prive.alerter_nouvelle_candidature() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS artisans_alerte_candidature ON public.artisans;
CREATE TRIGGER artisans_alerte_candidature
  AFTER INSERT ON public.artisans
  FOR EACH ROW WHEN (NEW.statut_candidature = 'en_attente')
  EXECUTE FUNCTION prive.alerter_nouvelle_candidature();
