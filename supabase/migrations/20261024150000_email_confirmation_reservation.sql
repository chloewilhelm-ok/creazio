-- M4 - Email de confirmation automatique à chaque réservation confirmée.
-- À l'insertion d'une réservation « confirmee », la base appelle l'Edge Function
-- envoyer-confirmation-reservation (extension pg_net). L'appel est mis en file d'attente et part
-- après la validation de la transaction : il ne bloque jamais la réservation, et une réservation
-- annulée (transaction annulée) n'envoie rien.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Date d'envoi de l'email de confirmation : garantit un seul envoi par réservation.
ALTER TABLE public.reservations ADD COLUMN email_confirmation_envoye_le timestamptz;
COMMENT ON COLUMN public.reservations.email_confirmation_envoye_le IS
  'Date d''envoi de l''email « Votre atelier est réservé » ; NULL = pas encore envoyé (ou échec, voir les logs de l''Edge Function).';

CREATE FUNCTION prive.notifier_reservation_confirmee()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://fljqrpshvlldtuseoogb.supabase.co/functions/v1/envoyer-confirmation-reservation',
      body := jsonb_build_object('reservation_id', NEW.id),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 10000
    );
  EXCEPTION WHEN OTHERS THEN
    -- Jamais de réservation bloquée par l'email : l'erreur est seulement journalisée.
    RAISE LOG 'notifier_reservation_confirmee: appel impossible pour % : %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION prive.notifier_reservation_confirmee() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER reservation_confirmee_email
  AFTER INSERT ON public.reservations
  FOR EACH ROW WHEN (NEW.statut = 'confirmee')
  EXECUTE FUNCTION prive.notifier_reservation_confirmee();
