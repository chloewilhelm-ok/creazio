-- Test de bout en bout des fonctions acheter_pack_demo, reserver_session et annuler_reservation.
-- À coller dans Supabase > SQL Editor APRÈS la migration 20261021190000.
-- Optionnel : remplace NULL par l'email d'un élève à la dernière ligne (sinon le premier élève trouvé est utilisé).
--
-- Ce qui reste en base après le test : un achat DEMO du pack de 100 € (l'élève garde ces crédits pour la démo)
-- et une réservation au statut "annulee_cliente". La place et le solde sont restaurés.

CREATE OR REPLACE FUNCTION pg_temp.tester_creazio(p_email text)
RETURNS TABLE (etape text, attendu text, obtenu text, ok boolean)
LANGUAGE plpgsql AS $$
#variable_conflict use_column
DECLARE
  v_eleve uuid;
  v_pack uuid;
  v_pack_credits integer;
  v_session uuid;
  v_prix integer;
  v_places_avant integer;
  v_places integer;
  v_solde_avant integer;
  v_solde integer;
  v_res record;
  v_msg text;
  v_n integer;
  v_taux numeric;
BEGIN
  -- Préparation (en tant qu'administrateur)
  SELECT p.id INTO v_eleve FROM public.profiles p
  WHERE p.role = 'eleve' AND (p_email IS NULL OR p.email = p_email) ORDER BY p.cree_le LIMIT 1;
  IF v_eleve IS NULL THEN
    etape := '0 préparation'; attendu := 'un élève existant'; obtenu := 'aucun élève trouvé'; ok := false; RETURN NEXT; RETURN;
  END IF;

  SELECT k.id, k.nombre_credits INTO v_pack, v_pack_credits FROM public.packs_credits k
  WHERE k.actif AND k.prix_eur = 100 LIMIT 1;
  IF v_pack IS NULL THEN
    etape := '0 préparation'; attendu := 'un pack actif à 100 €'; obtenu := 'aucun pack actif à 100 € dans packs_credits'; ok := false; RETURN NEXT; RETURN;
  END IF;

  -- Session la moins chère, future, ouverte, avec places, que l'élève n'a pas déjà réservée
  SELECT s.id, s.prix_credits INTO v_session, v_prix
  FROM public.sessions s JOIN public.ateliers a ON a.id = s.atelier_id
  WHERE a.statut = 'publie' AND s.statut = 'ouverte' AND s.debut_le > now() + interval '3 days'
    AND s.places_restantes > 0 AND s.prix_credits > 0
    AND NOT EXISTS (SELECT 1 FROM public.reservations r WHERE r.session_id = s.id AND r.eleve_id = v_eleve AND r.statut = 'confirmee')
  ORDER BY s.prix_credits, s.debut_le LIMIT 1;
  IF v_session IS NULL THEN
    etape := '0 préparation'; attendu := 'une session réservable dans plus de 3 jours avec un prix > 0'; obtenu := 'aucune session trouvée'; ok := false; RETURN NEXT; RETURN;
  END IF;

  SELECT CASE WHEN p.taux_commission > 1 THEN p.taux_commission / 100 ELSE p.taux_commission END INTO v_taux
  FROM public.parametres_plateforme p ORDER BY p.id LIMIT 1;

  etape := '0 préparation'; attendu := 'élève, pack et session trouvés';
  obtenu := 'élève ' || v_eleve || ' / session ' || v_session || ' à ' || v_prix || ' crédits'; ok := true; RETURN NEXT;

  -- À partir d'ici, on agit comme l'élève connecté (rôle authenticated + JWT simulé)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_eleve, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- (a) Achat du pack de 100 €
  SELECT coalesce((SELECT w.solde_credits FROM public.portefeuilles w WHERE w.eleve_id = v_eleve), 0) INTO v_solde_avant;
  v_solde := public.acheter_pack_demo(v_pack);
  etape := 'a achat pack 100 €'; attendu := 'solde ' || v_solde_avant || ' + ' || v_pack_credits;
  obtenu := 'solde ' || v_solde; ok := v_solde = v_solde_avant + v_pack_credits; RETURN NEXT;

  etape := 'a règle 1 crédit = 1 €'; attendu := 'pack 100 € = 100 crédits';
  obtenu := 'pack 100 € = ' || v_pack_credits || ' crédits'; ok := v_pack_credits = 100; RETURN NEXT;

  SELECT k.commission_eur INTO v_msg FROM public.achats_credits k
  WHERE k.eleve_id = v_eleve ORDER BY k.achete_le DESC LIMIT 1;
  etape := 'a pas de commission à l''achat'; attendu := 'commission_eur = 0';
  obtenu := 'commission_eur = ' || v_msg; ok := v_msg::numeric = 0; RETURN NEXT;

  -- (b) Réservation
  RESET ROLE;
  SELECT s.places_restantes INTO v_places_avant FROM public.sessions s WHERE s.id = v_session;
  SET LOCAL ROLE authenticated;
  v_solde_avant := v_solde;
  SELECT * INTO v_res FROM public.reserver_session(v_session);
  RESET ROLE;
  SELECT s.places_restantes INTO v_places FROM public.sessions s WHERE s.id = v_session;
  SET LOCAL ROLE authenticated;
  etape := 'b réservation'; attendu := 'solde -' || v_prix || ', places -1, code CRZ-XXXXXX';
  obtenu := 'solde ' || v_res.nouveau_solde || ', places ' || v_places_avant || ' -> ' || v_places || ', code ' || v_res.code_creazio;
  ok := v_res.nouveau_solde = v_solde_avant - v_prix AND v_places = v_places_avant - 1
        AND v_res.code_creazio ~ '^CRZ-[A-Z0-9]{6}$';
  RETURN NEXT;

  SELECT r.montant_artisan_eur::text INTO v_msg FROM public.reservations r WHERE r.id = v_res.reservation_id;
  etape := 'b part artisan (commission sur crédits dépensés)';
  attendu := round(v_prix * (1 - v_taux), 2) || ' € (' || v_prix || ' × ' || (1 - v_taux) || ')';
  obtenu := v_msg || ' €'; ok := v_msg::numeric = round(v_prix * (1 - v_taux), 2); RETURN NEXT;

  -- (c) Deuxième réservation de la même session
  BEGIN
    PERFORM public.reserver_session(v_session);
    v_msg := 'aucune erreur';
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM;
  END;
  etape := 'c 2e réservation même session'; attendu := 'erreur DEJA_RESERVE'; obtenu := v_msg; ok := v_msg LIKE 'DEJA_RESERVE:%'; RETURN NEXT;

  -- (e) Annulation (testée avant (d) : la session redevient libre pour le test du solde)
  v_solde := public.annuler_reservation(v_res.reservation_id);
  RESET ROLE;
  SELECT s.places_restantes INTO v_places FROM public.sessions s WHERE s.id = v_session;
  SET LOCAL ROLE authenticated;
  etape := 'e annulation'; attendu := 'solde ' || v_solde_avant || ', places ' || v_places_avant;
  obtenu := 'solde ' || v_solde || ', places ' || v_places; ok := v_solde = v_solde_avant AND v_places = v_places_avant; RETURN NEXT;

  -- (d) Solde insuffisant : sur la même session (redevenue libre), avec les lots de l'élève vidés.
  -- Le bloc se termine forcément par une erreur, donc PostgreSQL annule automatiquement la mise à zéro des lots.
  v_msg := NULL;
  BEGIN
    RESET ROLE;
    UPDATE public.lots_credits l SET credits_restants = 0 WHERE l.eleve_id = v_eleve;
    SET LOCAL ROLE authenticated;
    PERFORM public.reserver_session(v_session);
    v_msg := 'aucune erreur';
    RAISE EXCEPTION 'ANNULER_BLOC';
  EXCEPTION WHEN OTHERS THEN
    IF v_msg IS NULL THEN v_msg := SQLERRM; END IF;
  END;
  SET LOCAL ROLE authenticated;
  etape := 'd solde insuffisant'; attendu := 'erreur SOLDE_INSUFFISANT'; obtenu := v_msg; ok := v_msg LIKE 'SOLDE_INSUFFISANT:%'; RETURN NEXT;

  -- (f) RLS : l'élève relit ses données, et seulement les siennes
  SELECT count(*) INTO v_n FROM public.reservations r WHERE r.id = v_res.reservation_id AND r.statut = 'annulee_cliente';
  etape := 'f RLS lecture réservation'; attendu := '1 ligne visible'; obtenu := v_n || ' ligne(s)'; ok := v_n = 1; RETURN NEXT;

  SELECT count(*) INTO v_n FROM public.portefeuilles w WHERE w.eleve_id <> v_eleve;
  etape := 'f RLS portefeuilles des autres'; attendu := '0 ligne visible'; obtenu := v_n || ' ligne(s)'; ok := v_n = 0; RETURN NEXT;

  SELECT count(*) INTO v_n FROM public.lots_credits l WHERE l.eleve_id = v_eleve;
  etape := 'f RLS lecture lots'; attendu := 'au moins 1 lot visible'; obtenu := v_n || ' lot(s)'; ok := v_n >= 1; RETURN NEXT;

  -- (g) L'élève ne peut pas modifier son solde directement
  BEGIN
    UPDATE public.portefeuilles w SET solde_credits = 9999 WHERE w.eleve_id = v_eleve;
    v_msg := 'modification acceptée';
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM;
  END;
  etape := 'g écriture directe du solde'; attendu := 'refusée (permission denied)'; obtenu := v_msg; ok := v_msg LIKE 'permission denied%'; RETURN NEXT;

  RESET ROLE;
END;
$$;

SELECT * FROM pg_temp.tester_creazio(NULL);
