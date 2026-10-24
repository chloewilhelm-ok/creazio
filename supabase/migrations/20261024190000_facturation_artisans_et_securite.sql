-- M5 - Infos de facturation des artisans + correction d'une règle d'insertion trop large.
-- Validée et appliquée le 24/10/2026.

-- 1. Facturation : table à part, liée 1-1 à l'artisan. Sur la table artisans, tout utilisateur connecté
--    a le droit SELECT sur toutes les colonnes et la règle « Artisans validés visibles par les
--    utilisateurs connectés » montre les fiches validées à tous : une colonne ajoutée là serait lisible
--    par n'importe qui. Ici, seul l'artisan lit sa ligne ; personne ne l'écrit depuis le site
--    (remplissage à la main dans Supabase après signature du contrat). Pas d'IBAN.
CREATE OR REPLACE FUNCTION prive.siret_valide(p text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path TO '' AS $function$
DECLARE
  v_somme int := 0;
  v_chiffre int;
BEGIN
  IF p IS NULL OR p !~ '^[0-9]{14}$' THEN RETURN false; END IF;
  -- Établissements de La Poste (SIREN 356000000) : somme des chiffres multiple de 5.
  IF left(p, 9) = '356000000' THEN
    SELECT sum(substr(p, i, 1)::int) INTO v_somme FROM generate_series(1, 14) i;
    RETURN v_somme % 5 = 0;
  END IF;
  -- Clé de Luhn : un chiffre sur deux doublé en partant de la droite.
  FOR i IN 1..14 LOOP
    v_chiffre := substr(p, 15 - i, 1)::int;
    IF i % 2 = 0 THEN
      v_chiffre := v_chiffre * 2;
      IF v_chiffre > 9 THEN v_chiffre := v_chiffre - 9; END IF;
    END IF;
    v_somme := v_somme + v_chiffre;
  END LOOP;
  RETURN v_somme % 10 = 0;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.facturation_artisans (
  artisan_id uuid PRIMARY KEY REFERENCES public.artisans (profile_id) ON DELETE CASCADE,
  raison_sociale varchar(150),
  siret char(14) CHECK (siret IS NULL OR prive.siret_valide(siret)),
  adresse_facturation text,
  mis_a_jour_le timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.facturation_artisans IS
  'Infos de facturation saisies par Creazio après signature du contrat. Lecture : l''artisan concerné uniquement. Pas de donnée bancaire.';

ALTER TABLE public.facturation_artisans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.facturation_artisans FROM anon, authenticated;
GRANT SELECT ON public.facturation_artisans TO authenticated;
DROP POLICY IF EXISTS "Je vois ma facturation" ON public.facturation_artisans;
CREATE POLICY "Je vois ma facturation" ON public.facturation_artisans
  FOR SELECT TO authenticated USING (artisan_id = (SELECT auth.uid()));

-- 2. Sécurité : la règle « artisans_insert_own » (doublon de « Je dépose ma candidature ») ne vérifie
--    que l'identifiant. Comme les règles s'additionnent, elle permet à n'importe quel compte connecté,
--    élève compris, de créer sa fiche artisan directement « validee ». On la retire : reste « Je dépose
--    ma candidature », qui impose le statut « en_attente » (le site et le trigger d'inscription la respectent).
DROP POLICY IF EXISTS "artisans_insert_own" ON public.artisans;
