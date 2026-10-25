-- M5 - Audit sécurité : correctif de prive.proteger_prix_atelier (appliqué le 25/10 via le SQL Editor).
-- Dans une fonction SECURITY DEFINER, current_user vaut le propriétaire de la fonction : le test
-- « current_user IN ('authenticated','anon') » n'était jamais vrai, et un artisan pouvait fixer le prix
-- d'un nouvel atelier en appelant l'API. auth.role() lit le rôle du jeton de l'appelant.
CREATE OR REPLACE FUNCTION prive.proteger_prix_atelier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  -- auth.role() lit le rôle de l'appelant (jeton) ; current_user vaudrait ici le propriétaire de la fonction.
  IF coalesce(auth.role(), '') IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.prix_public_eur := (SELECT a.prix_cours_unite_eur FROM public.artisans a WHERE a.profile_id = NEW.artisan_id);
      NEW.prix_public_verifie_le := NULL;
      NEW.statut := 'en_verification';
    ELSE
      NEW.prix_public_eur := OLD.prix_public_eur;
      NEW.prix_public_verifie_le := OLD.prix_public_verifie_le;
    END IF;
  END IF;
  IF NEW.statut = 'en_verification' AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM NEW.statut) THEN
    NEW.alerte_verification_envoyee_le := NULL;
  END IF;
  RETURN NEW;
END;
$function$;
