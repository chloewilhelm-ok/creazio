-- Diagnostic en LECTURE SEULE : ne modifie rien.
-- À coller dans Supabase > SQL Editor, puis exporter le résultat (bouton "Copy" ou "Export > CSV").
SELECT * FROM (

  -- 1. Données de démo
  SELECT '1 données de démo' AS section, jsonb_pretty(jsonb_build_object(
    'profiles_par_role', (SELECT jsonb_object_agg(role, n) FROM (SELECT role, count(*) n FROM public.profiles GROUP BY role) s),
    'artisans_par_statut', (SELECT jsonb_object_agg(statut_candidature, n) FROM (SELECT statut_candidature, count(*) n FROM public.artisans GROUP BY statut_candidature) s),
    'ateliers_par_statut', (SELECT jsonb_object_agg(statut, n) FROM (SELECT statut, count(*) n FROM public.ateliers GROUP BY statut) s),
    'ateliers_publies_avec_prix', (SELECT count(*) FROM public.ateliers WHERE statut = 'publie' AND prix_public_eur IS NOT NULL),
    'recurrences', (SELECT count(*) FROM public.recurrences_sessions),
    'sessions_futures_reservables', (SELECT count(*) FROM public.sessions WHERE statut = 'ouverte' AND places_restantes > 0 AND debut_le > now()),
    'sessions_futures_prix_0', (SELECT count(*) FROM public.sessions WHERE debut_le > now() AND prix_credits = 0),
    'ateliers_avec_session_reservable', (SELECT count(DISTINCT atelier_id) FROM public.sessions WHERE statut = 'ouverte' AND places_restantes > 0 AND debut_le > now()),
    'exemples_sessions', (SELECT jsonb_agg(x) FROM (SELECT a.titre, s.debut_le, s.places_restantes, s.prix_credits, s.remise_pct, a.prix_public_eur
                          FROM public.sessions s JOIN public.ateliers a ON a.id = s.atelier_id
                          WHERE s.debut_le > now() ORDER BY s.debut_le LIMIT 5) x),
    'portefeuilles', (SELECT count(*) FROM public.portefeuilles),
    'solde_total', (SELECT coalesce(sum(solde_credits), 0) FROM public.portefeuilles),
    'reservations_par_statut', (SELECT jsonb_object_agg(statut, n) FROM (SELECT statut, count(*) n FROM public.reservations GROUP BY statut) s),
    'achats_credits', (SELECT count(*) FROM public.achats_credits),
    'lots_credits', (SELECT count(*) FROM public.lots_credits),
    'mouvements_credits', (SELECT count(*) FROM public.mouvements_credits)
  ))

  UNION ALL
  SELECT '2 packs_credits', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(p))), '[]') FROM public.packs_credits p

  UNION ALL
  SELECT '2 parametres_plateforme', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(p))), '[]') FROM public.parametres_plateforme p

  -- 3. Colonnes des tables liées aux crédits et aux réservations
  UNION ALL
  SELECT '3 colonnes ' || table_name,
    string_agg(column_name || ' ' || data_type || coalesce(' DEFAULT ' || column_default, '') ||
      CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END, E'\n' ORDER BY ordinal_position)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name IN ('reservations', 'sessions', 'portefeuilles', 'lots_credits',
    'mouvements_credits', 'achats_credits', 'packs_credits', 'parametres_plateforme', 'versements_artisans')
  GROUP BY table_name

  -- 4. Contraintes (clés, CHECK, UNIQUE)
  UNION ALL
  SELECT '4 contraintes ' || c.relname, string_agg(k.conname || ' : ' || pg_get_constraintdef(k.oid), E'\n' ORDER BY k.conname)
  FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
  WHERE c.relnamespace = 'public'::regnamespace
  GROUP BY c.relname

  -- 5. Triggers sur les tables publiques
  UNION ALL
  SELECT '5 triggers', string_agg(c.relname || ' . ' || t.tgname || ' -> ' || t.tgfoid::regproc::text, E'\n' ORDER BY c.relname, t.tgname)
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace

  -- 6. Fonctions non présentes dans les migrations du repo
  UNION ALL
  SELECT '6 fonction ' || p.oid::regprocedure::text, pg_get_functiondef(p.oid)
  FROM pg_proc p
  WHERE p.pronamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('public', 'prive'))
    AND p.prokind = 'f'
    AND p.proname NOT IN ('generer_sessions_atelier', 'generer_sessions_apres_recurrence', 'generer_sessions_apres_prix',
      'handle_new_user', 'savoir_faire_depuis_libelle', 'ateliers_recommandes', 'proteger_prix_atelier')

  -- 7. RLS : activation et règles
  UNION ALL
  SELECT '7 rls activée', string_agg(relname || ' = ' || relrowsecurity, E'\n' ORDER BY relname)
  FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'

  UNION ALL
  SELECT '7 policies ' || tablename,
    string_agg(policyname || ' [' || cmd || ' ' || array_to_string(roles, ',') || ']' || E'\n  using: ' || coalesce(qual, '-') ||
      E'\n  check: ' || coalesce(with_check, '-'), E'\n' ORDER BY policyname)
  FROM pg_policies WHERE schemaname = 'public'
  GROUP BY tablename

  -- 8. Droits du rôle "authenticated"
  UNION ALL
  SELECT '8 droits authenticated', string_agg(table_name || ' : ' || privs, E'\n' ORDER BY table_name)
  FROM (SELECT table_name, string_agg(privilege_type, ',' ORDER BY privilege_type) privs
        FROM information_schema.role_table_grants
        WHERE grantee = 'authenticated' AND table_schema = 'public' GROUP BY table_name) g

  -- 9. Extensions (utile pour l'automatisation : pg_cron, pg_net)
  UNION ALL
  SELECT '9 extensions', string_agg(extname || ' ' || extversion, E'\n' ORDER BY extname) FROM pg_extension

) diagnostic
ORDER BY section;
