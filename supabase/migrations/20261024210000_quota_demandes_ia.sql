-- M4 - IA « Trouve ton atelier idéal » : limite de 10 demandes par heure et par élève.
-- Le journal ne garde que l'identifiant de l'élève et l'heure de la demande (ni la phrase, ni la
-- réponse) et s'efface au bout de 24 h. Il n'est lisible ni modifiable par aucun utilisateur :
-- seule l'Edge Function trouver-atelier (clé service) l'utilise, via la fonction ci-dessous.

CREATE TABLE IF NOT EXISTS public.demandes_ia (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  eleve_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demandes_ia_eleve_date ON public.demandes_ia (eleve_id, cree_le);
COMMENT ON TABLE public.demandes_ia IS
  'Heures des demandes à l''IA « Trouve ton atelier idéal », pour limiter à 10 par heure. Effacées après 24 h.';
ALTER TABLE public.demandes_ia ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demandes_ia FROM anon, authenticated;

-- Compte la demande si le quota le permet. Renvoie le nombre de demandes restantes dans l'heure,
-- ou -1 si la limite est atteinte (rien n'est alors enregistré). Un verrou par élève évite que deux
-- demandes simultanées dépassent la limite.
CREATE OR REPLACE FUNCTION public.consommer_quota_ia(p_eleve uuid, p_limite integer DEFAULT 10)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_nb integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('quota_ia_' || p_eleve::text));
  DELETE FROM public.demandes_ia WHERE eleve_id = p_eleve AND cree_le < now() - interval '24 hours';
  SELECT count(*) INTO v_nb FROM public.demandes_ia WHERE eleve_id = p_eleve AND cree_le > now() - interval '1 hour';
  IF v_nb >= p_limite THEN RETURN -1; END IF;
  INSERT INTO public.demandes_ia (eleve_id) VALUES (p_eleve);
  RETURN p_limite - v_nb - 1;
END;
$function$;
REVOKE ALL ON FUNCTION public.consommer_quota_ia(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consommer_quota_ia(uuid, integer) TO service_role;
