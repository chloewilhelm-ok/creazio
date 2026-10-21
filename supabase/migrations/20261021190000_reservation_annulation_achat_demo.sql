-- M4 - Réservation, annulation et achat de crédits (démo)
-- Seules ces fonctions modifient les crédits et les places : le front ne fait que les appeler en RPC.
-- Erreurs métier : le message commence par un code (ex. SOLDE_INSUFFISANT) suivi d'une phrase à afficher.

CREATE SCHEMA IF NOT EXISTS prive;

-- ---------------------------------------------------------------------------
-- Outils internes (non appelables depuis l'API)
-- ---------------------------------------------------------------------------

-- Élève connecté, sinon erreur.
CREATE OR REPLACE FUNCTION prive.eleve_connecte()
RETURNS uuid LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE v_id uuid := auth.uid();
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'NON_CONNECTE: Connectez-vous pour continuer.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_id AND p.role = 'eleve') THEN
    RAISE EXCEPTION 'ROLE_INTERDIT: Cette action est réservée aux comptes élèves.';
  END IF;
  RETURN v_id;
END;
$$;

-- Paramètres de la plateforme (une seule ligne).
CREATE OR REPLACE FUNCTION prive.parametres()
RETURNS public.parametres_plateforme LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE v public.parametres_plateforme;
BEGIN
  SELECT * INTO v FROM public.parametres_plateforme ORDER BY id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PARAMETRES_MANQUANTS: La configuration de la plateforme est incomplète.';
  END IF;
  RETURN v;
END;
$$;

-- Taux de commission en fraction (accepte 0.15 ou 15).
CREATE OR REPLACE FUNCTION prive.taux_fraction(p_taux numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN p_taux > 1 THEN p_taux / 100 ELSE p_taux END;
$$;

-- Solde réellement utilisable : lots non expirés.
CREATE OR REPLACE FUNCTION prive.solde_disponible(p_eleve uuid)
RETURNS integer LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(sum(l.credits_restants), 0)::integer
  FROM public.lots_credits l
  WHERE l.eleve_id = p_eleve AND l.expire_le > now() AND l.credits_restants > 0;
$$;

-- Recalcule et enregistre le solde du portefeuille (le crée s'il manque).
CREATE OR REPLACE FUNCTION prive.maj_portefeuille(p_eleve uuid)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_solde integer := prive.solde_disponible(p_eleve);
BEGIN
  INSERT INTO public.portefeuilles (eleve_id, solde_credits, mis_a_jour_le)
  VALUES (p_eleve, v_solde, now())
  ON CONFLICT (eleve_id) DO UPDATE SET solde_credits = EXCLUDED.solde_credits, mis_a_jour_le = EXCLUDED.mis_a_jour_le;
  RETURN v_solde;
END;
$$;

-- Verrouille le portefeuille de l'élève pour éviter deux opérations simultanées sur ses crédits.
CREATE OR REPLACE FUNCTION prive.verrouiller_portefeuille(p_eleve uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.portefeuilles (eleve_id, solde_credits) VALUES (p_eleve, 0) ON CONFLICT (eleve_id) DO NOTHING;
  PERFORM 1 FROM public.portefeuilles w WHERE w.eleve_id = p_eleve FOR UPDATE;
END;
$$;

-- Code lisible CRZ-XXXXXX (sans 0/O ni 1/I/L), unique.
CREATE OR REPLACE FUNCTION prive.nouveau_code_creazio()
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
BEGIN
  LOOP
    SELECT 'CRZ-' || string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
    INTO v_code FROM generate_series(1, 6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.reservations r WHERE r.code_creazio = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION prive.eleve_connecte(), prive.parametres(), prive.taux_fraction(numeric),
  prive.solde_disponible(uuid), prive.maj_portefeuille(uuid), prive.verrouiller_portefeuille(uuid),
  prive.nouveau_code_creazio() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Achat d'un pack de crédits (mode démo, sans Stripe)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acheter_pack_demo(p_pack_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_eleve uuid := prive.eleve_connecte();
  v_param public.parametres_plateforme := prive.parametres();
  v_pack public.packs_credits;
  v_achat_id uuid;
  v_achete_le timestamptz;
  v_lot_id uuid;
BEGIN
  SELECT * INTO v_pack FROM public.packs_credits p WHERE p.id = p_pack_id AND p.actif;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PACK_INDISPONIBLE: Ce pack de crédits n''est pas disponible.';
  END IF;

  PERFORM prive.verrouiller_portefeuille(v_eleve);

  INSERT INTO public.achats_credits (eleve_id, pack_id, nombre_credits, montant_paye_eur, taux_commission,
    commission_eur, statut_paiement, reference_paiement, conserver_jusqu_au)
  VALUES (v_eleve, v_pack.id, v_pack.nombre_credits, v_pack.prix_eur, v_param.taux_commission,
    round(v_pack.prix_eur * prive.taux_fraction(v_param.taux_commission), 2), 'reussi',
    'DEMO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    now() + make_interval(years => v_param.duree_conservation_traces_achat_annees))
  RETURNING id, achete_le INTO v_achat_id, v_achete_le;

  INSERT INTO public.lots_credits (achat_id, eleve_id, credits_initiaux, credits_restants, expire_le)
  VALUES (v_achat_id, v_eleve, v_pack.nombre_credits, v_pack.nombre_credits,
    v_achete_le + make_interval(months => v_param.validite_credits_mois))
  RETURNING id INTO v_lot_id;

  INSERT INTO public.mouvements_credits (lot_id, type_mouvement, credits)
  VALUES (v_lot_id, 'achat', v_pack.nombre_credits);

  RETURN prive.maj_portefeuille(v_eleve);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Réservation d'une session avec ses crédits
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserver_session(p_session_id uuid)
RETURNS TABLE (reservation_id uuid, code_creazio text, nouveau_solde integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_eleve uuid := prive.eleve_connecte();
  v_param public.parametres_plateforme := prive.parametres();
  v_session public.sessions;
  v_dispo integer;
  v_reste integer;
  v_pris integer;
  v_lot record;
  v_res_id uuid;
  v_code text;
BEGIN
  -- Verrou sur la session : si deux élèves visent la dernière place, le second attend puis voit 0 place.
  SELECT s.* INTO v_session
  FROM public.sessions s JOIN public.ateliers a ON a.id = s.atelier_id
  WHERE s.id = p_session_id AND a.statut = 'publie'
  FOR UPDATE OF s;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_INTROUVABLE: Ce créneau n''existe pas ou n''est plus proposé.';
  END IF;
  IF v_session.statut <> 'ouverte' THEN
    RAISE EXCEPTION 'SESSION_FERMEE: Ce créneau n''est plus ouvert à la réservation.';
  END IF;
  IF v_session.debut_le <= now() THEN
    RAISE EXCEPTION 'SESSION_PASSEE: Ce créneau est déjà passé.';
  END IF;
  IF v_session.places_restantes <= 0 THEN
    RAISE EXCEPTION 'COMPLET: Il n''y a plus de place sur ce créneau.';
  END IF;
  IF v_session.prix_credits <= 0 THEN
    RAISE EXCEPTION 'PRIX_INDISPONIBLE: Le prix de ce créneau n''est pas encore fixé.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.reservations r
             WHERE r.session_id = v_session.id AND r.eleve_id = v_eleve AND r.statut = 'confirmee') THEN
    RAISE EXCEPTION 'DEJA_RESERVE: Vous avez déjà réservé ce créneau.';
  END IF;

  PERFORM prive.verrouiller_portefeuille(v_eleve);
  v_dispo := prive.solde_disponible(v_eleve);
  IF v_dispo < v_session.prix_credits THEN
    RAISE EXCEPTION 'SOLDE_INSUFFISANT: Il vous faut % crédits, votre solde est de % crédits.', v_session.prix_credits, v_dispo;
  END IF;

  v_code := prive.nouveau_code_creazio();
  INSERT INTO public.reservations (session_id, eleve_id, statut, credits_debites, montant_artisan_eur, code_creazio)
  VALUES (v_session.id, v_eleve, 'confirmee', v_session.prix_credits,
    round(v_session.prix_credits * (1 - prive.taux_fraction(v_param.taux_commission)), 2), v_code)
  RETURNING id INTO v_res_id;

  -- Débit des lots, du plus ancien au plus récent : un mouvement par lot touché.
  v_reste := v_session.prix_credits;
  FOR v_lot IN
    SELECT l.id, l.credits_restants FROM public.lots_credits l
    WHERE l.eleve_id = v_eleve AND l.expire_le > now() AND l.credits_restants > 0
    ORDER BY l.expire_le, l.cree_le
    FOR UPDATE
  LOOP
    EXIT WHEN v_reste = 0;
    v_pris := least(v_lot.credits_restants, v_reste);
    UPDATE public.lots_credits l SET credits_restants = l.credits_restants - v_pris WHERE l.id = v_lot.id;
    INSERT INTO public.mouvements_credits (lot_id, reservation_id, type_mouvement, credits)
    VALUES (v_lot.id, v_res_id, 'debit_reservation', -v_pris);
    v_reste := v_reste - v_pris;
  END LOOP;

  UPDATE public.sessions s SET places_restantes = s.places_restantes - 1 WHERE s.id = v_session.id;

  RETURN QUERY SELECT v_res_id, v_code, prive.maj_portefeuille(v_eleve);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Annulation par l'élève (gratuite jusqu'au délai fixé dans les paramètres)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.annuler_reservation(p_reservation_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_eleve uuid := prive.eleve_connecte();
  v_param public.parametres_plateforme := prive.parametres();
  v_res public.reservations;
  v_session public.sessions;
  v_mvt record;
BEGIN
  SELECT r.* INTO v_res FROM public.reservations r
  WHERE r.id = p_reservation_id AND r.eleve_id = v_eleve
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_INTROUVABLE: Cette réservation n''existe pas.';
  END IF;
  IF v_res.statut <> 'confirmee' THEN
    RAISE EXCEPTION 'RESERVATION_NON_ANNULABLE: Cette réservation est déjà annulée.';
  END IF;

  SELECT s.* INTO v_session FROM public.sessions s WHERE s.id = v_res.session_id FOR UPDATE;
  IF v_session.debut_le - now() <= make_interval(hours => v_param.delai_annulation_gratuite_heures) THEN
    RAISE EXCEPTION 'DELAI_DEPASSE: L''annulation gratuite est possible jusqu''à % h avant le début de l''atelier.',
      v_param.delai_annulation_gratuite_heures;
  END IF;

  PERFORM prive.verrouiller_portefeuille(v_eleve);

  -- Recrédit dans les lots d'origine : chaque lot garde sa date d'expiration.
  FOR v_mvt IN
    SELECT m.lot_id, abs(m.credits)::integer AS credits FROM public.mouvements_credits m
    WHERE m.reservation_id = v_res.id AND m.type_mouvement = 'debit_reservation'
  LOOP
    UPDATE public.lots_credits l SET credits_restants = l.credits_restants + v_mvt.credits WHERE l.id = v_mvt.lot_id;
    INSERT INTO public.mouvements_credits (lot_id, reservation_id, type_mouvement, credits)
    VALUES (v_mvt.lot_id, v_res.id, 'recredit_annulation_cliente', v_mvt.credits);
  END LOOP;

  UPDATE public.sessions s SET places_restantes = least(s.places_restantes + 1, s.places_ouvertes_creazio)
  WHERE s.id = v_session.id;
  UPDATE public.reservations r SET statut = 'annulee_cliente', annulee_le = now() WHERE r.id = v_res.id;

  RETURN prive.maj_portefeuille(v_eleve);
END;
$$;

REVOKE ALL ON FUNCTION public.acheter_pack_demo(uuid), public.reserver_session(uuid), public.annuler_reservation(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acheter_pack_demo(uuid), public.reserver_session(uuid), public.annuler_reservation(uuid)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS : l'élève relit uniquement ses propres crédits et réservations.
-- Les écritures passent uniquement par les fonctions ci-dessus.
-- ---------------------------------------------------------------------------
ALTER TABLE public.portefeuilles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achats_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON public.portefeuilles, public.lots_credits, public.mouvements_credits,
  public.achats_credits, public.reservations FROM anon, authenticated;
GRANT SELECT ON public.portefeuilles, public.lots_credits, public.mouvements_credits,
  public.achats_credits, public.reservations TO authenticated;

DROP POLICY IF EXISTS "eleve_lit_son_portefeuille" ON public.portefeuilles;
CREATE POLICY "eleve_lit_son_portefeuille" ON public.portefeuilles FOR SELECT TO authenticated
  USING (eleve_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "eleve_lit_ses_lots" ON public.lots_credits;
CREATE POLICY "eleve_lit_ses_lots" ON public.lots_credits FOR SELECT TO authenticated
  USING (eleve_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "eleve_lit_ses_mouvements" ON public.mouvements_credits;
CREATE POLICY "eleve_lit_ses_mouvements" ON public.mouvements_credits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lots_credits l WHERE l.id = lot_id AND l.eleve_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "eleve_lit_ses_achats" ON public.achats_credits;
CREATE POLICY "eleve_lit_ses_achats" ON public.achats_credits FOR SELECT TO authenticated
  USING (eleve_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "eleve_lit_ses_reservations" ON public.reservations;
CREATE POLICY "eleve_lit_ses_reservations" ON public.reservations FOR SELECT TO authenticated
  USING (eleve_id = (SELECT auth.uid()));
