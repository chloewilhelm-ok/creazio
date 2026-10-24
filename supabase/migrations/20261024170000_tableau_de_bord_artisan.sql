-- M5 - Dashboard artisan (« Mes revenus ») : lecture seule.
-- Deux fonctions de lecture réservées au rôle artisan, limitées à ses propres ateliers. Elles
-- tournent avec les droits du propriétaire (pour lire le seul prénom des élèves, que la RLS de
-- profiles ne montre pas aux artisans) : le filtre ateliers.artisan_id = auth.uid() est donc
-- écrit dans chaque requête. Aucune donnée de contact de l'élève n'est exposée (ni nom, ni email).
-- Enfin, la table reservations rejoint la publication Realtime : chaque utilisateur ne reçoit que
-- les lignes que ses règles RLS de lecture l'autorisent à voir (l'artisan : celles de ses sessions).

CREATE FUNCTION prive.exiger_artisan()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NON_CONNECTE: connexion requise'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'artisan') THEN
    RAISE EXCEPTION 'ROLE_INTERDIT: réservé aux artisans';
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION prive.exiger_artisan() FROM PUBLIC, anon, authenticated;

-- Réservations des ateliers de l'artisan connecté (12 derniers mois et à venir).
CREATE FUNCTION public.reservations_artisan()
RETURNS TABLE (
  reservation_id uuid,
  session_id uuid,
  debut_le timestamptz,
  atelier_titre varchar,
  prenom varchar,
  code_creazio varchar,
  credits_debites integer,
  montant_artisan_eur numeric,
  statut public.statut_reservation,
  versee boolean,
  reservee_le timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  PERFORM prive.exiger_artisan();
  RETURN QUERY
  SELECT r.id, s.id, s.debut_le, a.titre, nullif(trim(p.prenom), '')::varchar, r.code_creazio,
         r.credits_debites, r.montant_artisan_eur, r.statut, r.versement_id IS NOT NULL, r.reservee_le
  FROM public.reservations r
  JOIN public.sessions s ON s.id = r.session_id
  JOIN public.ateliers a ON a.id = s.atelier_id
  LEFT JOIN public.profiles p ON p.id = r.eleve_id
  WHERE a.artisan_id = auth.uid()
    AND s.debut_le >= now() - interval '12 months'
  ORDER BY s.debut_le DESC, r.reservee_le DESC;
END;
$function$;

-- Créneaux des ateliers de l'artisan connecté, de 9 semaines avant à 5 semaines après aujourd'hui,
-- avec le nombre de places réservées (réservations confirmées) sur les places ouvertes à Creazio.
CREATE FUNCTION public.sessions_artisan()
RETURNS TABLE (
  session_id uuid,
  atelier_titre varchar,
  debut_le timestamptz,
  places_ouvertes_creazio smallint,
  places_reservees integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  PERFORM prive.exiger_artisan();
  RETURN QUERY
  SELECT s.id, a.titre, s.debut_le, s.places_ouvertes_creazio,
         (SELECT count(*)::integer FROM public.reservations r WHERE r.session_id = s.id AND r.statut = 'confirmee')
  FROM public.sessions s
  JOIN public.ateliers a ON a.id = s.atelier_id
  WHERE a.artisan_id = auth.uid()
    AND s.statut = 'ouverte'
    AND s.debut_le >= now() - interval '9 weeks'
    AND s.debut_le < now() + interval '5 weeks'
  ORDER BY s.debut_le;
END;
$function$;

REVOKE ALL ON FUNCTION public.reservations_artisan() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sessions_artisan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reservations_artisan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sessions_artisan() TO authenticated;

-- Temps réel : nouvelles réservations et annulations poussées aux navigateurs abonnés (RLS appliquée).
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
