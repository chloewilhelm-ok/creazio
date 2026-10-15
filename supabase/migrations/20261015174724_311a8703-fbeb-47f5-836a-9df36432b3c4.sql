ALTER TABLE public.ateliers ALTER COLUMN prix_public_eur DROP NOT NULL;
COMMENT ON COLUMN public.ateliers.prix_public_eur IS 'Prix du cours à l''unité (€ TTC), fixé uniquement par l''administrateur Creazio.';

CREATE OR REPLACE FUNCTION prive.proteger_prix_atelier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.prix_public_eur := NULL;
      NEW.prix_public_verifie_le := NULL;
    ELSE
      NEW.prix_public_eur := OLD.prix_public_eur;
      NEW.prix_public_verifie_le := OLD.prix_public_verifie_le;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION prive.proteger_prix_atelier() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ateliers_proteger_prix ON public.ateliers;
CREATE TRIGGER ateliers_proteger_prix BEFORE INSERT OR UPDATE ON public.ateliers
FOR EACH ROW EXECUTE FUNCTION prive.proteger_prix_atelier();