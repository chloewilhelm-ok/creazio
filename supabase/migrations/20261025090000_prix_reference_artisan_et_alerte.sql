-- M5 - Prix de référence artisan et alerte de vérification.
-- 1. artisans.prix_cours_unite_eur : prix d'un cours à l'unité (€ TTC), rempli à la main par Creazio.
--    Les artisans ne peuvent ni l'écrire ni le modifier (aucun droit de colonne pour authenticated).
-- 2. Un atelier créé par un artisan reprend ce prix et part en « en_verification » (invisible des élèves).
-- 3. Si Creazio corrige le prix pendant la vérification, les créneaux à venir sans réservation sont recalculés.
-- 4. À la création (ou au retour en « en_verification »), la base appelle l'Edge Function
--    alerter-verification-atelier, qui écrit à contact@creazio.fr. Un échec n'empêche jamais l'enregistrement.
-- Idempotent : peut être rejoué sans effet de bord.

ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS prix_cours_unite_eur numeric(8,2);
DO $$ BEGIN
  ALTER TABLE public.artisans ADD CONSTRAINT artisans_prix_cours_unite_positif
    CHECK (prix_cours_unite_eur IS NULL OR prix_cours_unite_eur > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMENT ON COLUMN public.artisans.prix_cours_unite_eur IS
  'Prix public d''un cours à l''unité (€ TTC) fixé avec Creazio au début du partenariat. Rempli uniquement par Creazio ; repris par chaque nouvel atelier.';

ALTER TABLE public.ateliers ADD COLUMN IF NOT EXISTS alerte_verification_envoyee_le timestamptz;
COMMENT ON COLUMN public.ateliers.alerte_verification_envoyee_le IS
  'Date d''envoi de l''alerte « atelier à vérifier » à contact@creazio.fr ; remise à NULL à chaque passage en en_verification (un seul email par passage).';

-- Remplace la version qui mettait le prix à NULL à l'insertion : l'atelier reprend désormais le prix de
-- référence de son artisan. La mise à jour reste verrouillée pour les artisans (prix et date de vérification).
CREATE OR REPLACE FUNCTION prive.proteger_prix_atelier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.prix_public_eur := (SELECT a.prix_cours_unite_eur FROM public.artisans a WHERE a.profile_id = NEW.artisan_id);
      NEW.prix_public_verifie_le := NULL;
      NEW.statut := 'en_verification';
    ELSE
      NEW.prix_public_eur := OLD.prix_public_eur;
      NEW.prix_public_verifie_le := OLD.prix_public_verifie_le;
    END IF;
  END IF;
  -- Chaque passage en vérification rouvre l'envoi d'une alerte.
  IF NEW.statut = 'en_verification' AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM NEW.statut) THEN
    NEW.alerte_verification_envoyee_le := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Prix corrigé par Creazio : recalcule les créneaux à venir qui n'ont aucune réservation confirmée
-- (même formule que prive.preparer_session). Les créneaux déjà réservés gardent leur prix.
CREATE OR REPLACE FUNCTION prive.recalculer_prix_sessions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  UPDATE public.sessions s
     SET prix_credits = round(NEW.prix_public_eur * (1 - s.remise_pct / 100))::integer
   WHERE s.atelier_id = NEW.id
     AND s.debut_le > now()
     AND NOT EXISTS (SELECT 1 FROM public.reservations r WHERE r.session_id = s.id AND r.statut = 'confirmee');
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS ateliers_recalculer_prix_sessions ON public.ateliers;
CREATE TRIGGER ateliers_recalculer_prix_sessions
  AFTER UPDATE OF prix_public_eur ON public.ateliers
  FOR EACH ROW WHEN (NEW.prix_public_eur IS NOT NULL AND NEW.prix_public_eur IS DISTINCT FROM OLD.prix_public_eur)
  EXECUTE FUNCTION prive.recalculer_prix_sessions();

-- Alerte : appel de l'Edge Function, qui relit l'atelier avec la clé service. Un échec est journalisé
-- et n'annule jamais la création de l'atelier.
CREATE OR REPLACE FUNCTION prive.alerter_verification_atelier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  IF NEW.statut <> 'en_verification' OR (TG_OP = 'UPDATE' AND OLD.statut = NEW.statut) THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://fljqrpshvlldtuseoogb.supabase.co/functions/v1/alerter-verification-atelier',
      body := jsonb_build_object('atelier_id', NEW.id),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 10000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'alerter_verification_atelier: appel impossible pour % : %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS ateliers_alerte_verification ON public.ateliers;
CREATE TRIGGER ateliers_alerte_verification
  AFTER INSERT OR UPDATE OF statut ON public.ateliers
  FOR EACH ROW EXECUTE FUNCTION prive.alerter_verification_atelier();

REVOKE ALL ON FUNCTION prive.recalculer_prix_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION prive.alerter_verification_atelier() FROM PUBLIC, anon, authenticated;
