-- 05 - Historique de démo pour le dashboard artisan (« Mes revenus »)
-- Compte artisan chloe.wilhelm@outlook.fr, atelier de poterie.
--
-- Ajoute UNIQUEMENT de nouvelles lignes, sur les 8 semaines passées (avant les sessions réelles) :
--   * 5 créneaux par semaine (lun 19h, mer 19h, sam 10h, sam 19h, dim 15h, heure de Paris),
--     4 places ouvertes à Creazio sur 8 ;
--   * des réservations anonymes (eleve_id vide : aucun compte élève n'est touché), payées 32 crédits,
--     part artisan 27,20 € (85 %, comme dans reserver_session) ;
--   * un versement de démo pour les séances terminées depuis plus de 14 jours.
-- Le remplissage varie selon le créneau (le samedi matin est plein, le lundi soir est creux) pour que
-- les graphiques soient parlants. Les identifiants sont calculés (md5) : le script ne s'applique
-- qu'une fois, et l'annulation (en bas) ne retire que ces lignes-là.
-- Aucune ligne existante n'est modifiée ou supprimée.

DO $$
DECLARE
  v_atelier uuid;
  v_artisan uuid;
  v_lundi date := (date_trunc('week', now() AT TIME ZONE 'Europe/Paris'))::date; -- lundi de la semaine en cours
  v_creneau record;
  v_semaine int;
  v_session uuid;
  v_debut timestamptz;
  v_nb int;
  v_i int;
  v_versement uuid := md5('creazio-demo-dashboard-versement')::uuid;
BEGIN
  SELECT a.id, a.artisan_id INTO v_atelier, v_artisan
  FROM public.ateliers a JOIN public.profiles p ON p.id = a.artisan_id
  WHERE p.email = 'chloe.wilhelm@outlook.fr' AND a.savoir_faire = 'poterie_ceramique'
  ORDER BY a.cree_le LIMIT 1;
  IF v_atelier IS NULL THEN RAISE EXCEPTION 'Atelier de poterie de chloe.wilhelm@outlook.fr introuvable'; END IF;
  IF EXISTS (SELECT 1 FROM public.sessions WHERE id = md5('creazio-demo-dashboard-8-1')::uuid) THEN
    RAISE NOTICE 'Historique de démo déjà présent : rien à faire.';
    RETURN;
  END IF;

  FOR v_semaine IN 1..8 LOOP          -- 1 = semaine dernière, 8 = il y a 8 semaines
    FOR v_creneau IN
      SELECT * FROM (VALUES
        (1, 0, time '19:00', 0.4),     -- lundi 19h : creux
        (2, 2, time '19:00', 1.6),     -- mercredi 19h : moyen
        (3, 5, time '10:00', 3.8),     -- samedi 10h : plein
        (4, 5, time '19:00', 3.0),     -- samedi 19h : bien rempli
        (5, 6, time '15:00', 2.2)      -- dimanche 15h : moyen
      ) AS c(num, decalage_jour, heure, base)
    LOOP
      v_session := md5('creazio-demo-dashboard-' || v_semaine || '-' || v_creneau.num)::uuid;
      v_debut := ((v_lundi - 7 * v_semaine + v_creneau.decalage_jour) + v_creneau.heure) AT TIME ZONE 'Europe/Paris';
      INSERT INTO public.sessions (id, atelier_id, debut_le, fin_le, places_totales, places_ouvertes_creazio, places_restantes, remise_pct, prix_credits)
      VALUES (v_session, v_atelier, v_debut, v_debut + interval '2 hours', 8, 4, 4, 20, 0); -- prix et places restantes recalculés par le trigger

      -- Remplissage : niveau du créneau + légère progression récente + petite variation déterministe.
      v_nb := least(4, greatest(0, round(v_creneau.base + (8 - v_semaine) * 0.1
                + ((abs(hashtext(v_session::text)) % 3) - 1) * 0.6)::int));
      FOR v_i IN 1..v_nb LOOP
        INSERT INTO public.reservations (session_id, eleve_id, statut, credits_debites, montant_artisan_eur, code_creazio, reservee_le)
        SELECT v_session, NULL, 'confirmee', s.prix_credits,
               round(s.prix_credits * (1 - prive.taux_fraction(pp.taux_commission)), 2),
               prive.nouveau_code_creazio(), v_debut - make_interval(days => 2 + v_i * 3)
        FROM public.sessions s CROSS JOIN public.parametres_plateforme pp WHERE s.id = v_session;
      END LOOP;
      UPDATE public.sessions SET places_restantes = places_ouvertes_creazio - v_nb WHERE id = v_session;
    END LOOP;
  END LOOP;

  -- Versement de démo : séances de démo terminées depuis plus de 14 jours.
  INSERT INTO public.versements_artisans (id, artisan_id, montant_eur, virement_effectue_le, reference_virement)
  SELECT v_versement, v_artisan, coalesce(sum(r.montant_artisan_eur), 0), now() - interval '3 days', 'DEMO-VIR-001'
  FROM public.reservations r JOIN public.sessions s ON s.id = r.session_id
  WHERE s.id IN (SELECT md5('creazio-demo-dashboard-' || w || '-' || c)::uuid FROM generate_series(1, 8) w, generate_series(1, 5) c)
    AND s.fin_le < now() - interval '14 days';
  UPDATE public.reservations r SET versement_id = v_versement
  FROM public.sessions s
  WHERE s.id = r.session_id
    AND s.id IN (SELECT md5('creazio-demo-dashboard-' || w || '-' || c)::uuid FROM generate_series(1, 8) w, generate_series(1, 5) c)
    AND s.fin_le < now() - interval '14 days';

  RAISE NOTICE 'Historique de démo ajouté : % séances, % réservations.',
    (SELECT count(*) FROM public.sessions WHERE id IN (SELECT md5('creazio-demo-dashboard-' || w || '-' || c)::uuid FROM generate_series(1, 8) w, generate_series(1, 5) c)),
    (SELECT count(*) FROM public.reservations WHERE session_id IN (SELECT md5('creazio-demo-dashboard-' || w || '-' || c)::uuid FROM generate_series(1, 8) w, generate_series(1, 5) c));
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ANNULER l'historique de démo : copier les 4 lignes ci-dessous (sans les « -- ») dans le SQL Editor.
-- Elles ne retirent que les lignes créées par ce script (identifiants calculés plus haut).
--
-- DELETE FROM public.reservations WHERE session_id IN (SELECT md5('creazio-demo-dashboard-' || w || '-' || c)::uuid FROM generate_series(1, 8) w, generate_series(1, 5) c);
-- DELETE FROM public.versements_artisans WHERE id = md5('creazio-demo-dashboard-versement')::uuid;
-- DELETE FROM public.sessions WHERE id IN (SELECT md5('creazio-demo-dashboard-' || w || '-' || c)::uuid FROM generate_series(1, 8) w, generate_series(1, 5) c);
-- SELECT 'Historique de démo retiré' AS resultat;
