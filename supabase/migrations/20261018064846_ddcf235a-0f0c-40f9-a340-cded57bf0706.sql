CREATE OR REPLACE FUNCTION prive.generer_sessions_atelier(p_atelier_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE a public.ateliers%ROWTYPE;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_atelier_id::text, 0));
  SELECT * INTO a FROM public.ateliers WHERE id=p_atelier_id;
  IF NOT FOUND OR a.prix_public_eur IS NULL OR a.statut='archive' THEN RETURN; END IF;
  INSERT INTO public.sessions(atelier_id,recurrence_id,debut_le,fin_le,places_totales,places_ouvertes_creazio,places_restantes,remise_pct,prix_credits,statut)
  SELECT a.id,r.id,t.debut,t.debut+pg_catalog.make_interval(mins=>a.duree_minutes),r.places_totales,r.places_ouvertes_creazio,r.places_ouvertes_creazio,r.remise_pct,0,'ouverte'
  FROM public.recurrences_sessions r
  CROSS JOIN LATERAL pg_catalog.generate_series(0, r.date_fin-greatest(r.date_debut,(now() AT TIME ZONE 'Europe/Paris')::date)) AS j(n)
  CROSS JOIN LATERAL (SELECT greatest(r.date_debut,(now() AT TIME ZONE 'Europe/Paris')::date)+j.n AS jour) d
  CROSS JOIN LATERAL (SELECT (d.jour+r.heure_debut) AT TIME ZONE 'Europe/Paris' AS debut) t
  WHERE r.atelier_id=a.id AND r.places_ouvertes_creazio>0 AND t.debut>now()
    AND extract(isodow FROM d.jour)=array_position(ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],r.jour_semaine::text)
    AND NOT EXISTS(SELECT 1 FROM public.sessions s WHERE s.atelier_id=a.id AND s.debut_le=t.debut);
END;
$$;
REVOKE ALL ON FUNCTION prive.generer_sessions_atelier(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION prive.generer_sessions_apres_recurrence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM prive.generer_sessions_atelier(NEW.atelier_id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION prive.generer_sessions_apres_recurrence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER recurrences_generer_sessions AFTER INSERT OR UPDATE ON public.recurrences_sessions FOR EACH ROW EXECUTE FUNCTION prive.generer_sessions_apres_recurrence();
CREATE OR REPLACE FUNCTION prive.generer_sessions_apres_prix()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM prive.generer_sessions_atelier(NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION prive.generer_sessions_apres_prix() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ateliers_generer_sessions AFTER UPDATE OF prix_public_eur,statut ON public.ateliers FOR EACH ROW EXECUTE FUNCTION prive.generer_sessions_apres_prix();
DO $$ DECLARE v_id uuid; BEGIN
  FOR v_id IN SELECT DISTINCT atelier_id FROM public.recurrences_sessions LOOP
    PERFORM prive.generer_sessions_atelier(v_id);
  END LOOP;
END $$;