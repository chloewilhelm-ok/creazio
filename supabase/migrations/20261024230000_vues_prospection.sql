-- M4 - Vues anonymes de demande pour l'agent Cowork de prospection.
-- Schéma « prospection » séparé, absent de l'API publique : aucun droit pour anon ni authenticated.
-- Il n'est lu que par le connecteur Supabase de l'agent (rôle propriétaire de la base).
-- Minimisation (RGPD, art. 5.1.c) : les vues ne renvoient que des comptages par zone et par
-- savoir-faire, jamais une ligne par personne ni un nom, un email, une adresse ou un identifiant.

CREATE SCHEMA IF NOT EXISTS prospection;
COMMENT ON SCHEMA prospection IS
  'Agrégats anonymes pour l''agent de prospection. Aucun droit pour les rôles de l''API (anon, authenticated).';

-- Zone lisible à partir du code postal : « Paris 18e », « Paris 1er », sinon la ville.
CREATE OR REPLACE FUNCTION prospection.zone(p_code_postal text, p_ville text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO '' AS $function$
  SELECT CASE
    WHEN trim(p_code_postal) ~ '^750(0[1-9]|1[0-9]|20)$' THEN
      'Paris ' || right(trim(p_code_postal), 2)::int || CASE WHEN right(trim(p_code_postal), 2)::int = 1 THEN 'er' ELSE 'e' END
    WHEN trim(p_code_postal) = '75116' THEN 'Paris 16e'
    ELSE coalesce(nullif(initcap(trim(p_ville)), ''), 'Zone inconnue')
  END
$function$;

-- Libellés pour les phrases d'explication : « aime le métal », « aucun atelier de métal ».
CREATE OR REPLACE FUNCTION prospection.libelle(p_savoir_faire public.savoir_faire, p_avec_article boolean)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO '' AS $function$
  SELECT CASE p_savoir_faire
    WHEN 'poterie_ceramique' THEN CASE WHEN p_avec_article THEN 'la poterie' ELSE 'poterie' END
    WHEN 'textile' THEN CASE WHEN p_avec_article THEN 'le textile' ELSE 'textile' END
    WHEN 'bois' THEN CASE WHEN p_avec_article THEN 'le bois' ELSE 'bois' END
    WHEN 'vegetal' THEN CASE WHEN p_avec_article THEN 'le végétal' ELSE 'végétal' END
    WHEN 'papier' THEN CASE WHEN p_avec_article THEN 'le papier' ELSE 'papier' END
    WHEN 'cosmetique_bien_etre' THEN CASE WHEN p_avec_article THEN 'la cosmétique et le bien-être' ELSE 'cosmétique et bien-être' END
    WHEN 'bijouterie' THEN CASE WHEN p_avec_article THEN 'la bijouterie' ELSE 'bijouterie' END
    WHEN 'metal' THEN CASE WHEN p_avec_article THEN 'le métal' ELSE 'métal' END
    WHEN 'cuir' THEN CASE WHEN p_avec_article THEN 'le cuir' ELSE 'cuir' END
    WHEN 'verre' THEN CASE WHEN p_avec_article THEN 'le verre' ELSE 'verre' END
    WHEN 'a_manger' THEN CASE WHEN p_avec_article THEN 'la cuisine' ELSE 'cuisine' END
    WHEN 'a_boire' THEN CASE WHEN p_avec_article THEN 'les boissons' ELSE 'boissons' END
  END
$function$;

-- 1. Demande : élèves par zone, et pour chaque savoir-faire le nombre d'élèves qui l'ont en favori.
CREATE OR REPLACE VIEW prospection.demande_par_zone AS
WITH eleves AS (
  SELECT p.id, prospection.zone(p.code_postal, p.ville) AS zone
  FROM public.profiles p
  WHERE p.role = 'eleve' AND p.suppression_demandee_le IS NULL
),
totaux AS (SELECT zone, count(*)::int AS nb_eleves FROM eleves GROUP BY zone)
SELECT t.zone, t.nb_eleves, f.savoir_faire, count(DISTINCT e.id)::int AS nb_eleves_interesses
FROM eleves e
JOIN public.profil_savoirs_faire f ON f.profile_id = e.id
JOIN totaux t ON t.zone = e.zone
GROUP BY t.zone, t.nb_eleves, f.savoir_faire;
COMMENT ON VIEW prospection.demande_par_zone IS
  'Demande anonyme : par zone (arrondissement ou ville), nombre d''élèves et nombre d''élèves ayant chaque savoir-faire en favori. Minimisation RGPD : uniquement des COUNT, aucune ligne individuelle, aucun nom, email, adresse ni identifiant. Les comptes en cours de suppression sont exclus.';

-- 2. Offre : par zone et savoir-faire, ateliers publiés et créneaux ouverts à venir.
CREATE OR REPLACE VIEW prospection.offre_par_zone AS
SELECT prospection.zone(a.code_postal, a.ville) AS zone, a.savoir_faire,
       count(DISTINCT a.id)::int AS nb_ateliers,
       count(s.id)::int AS nb_creneaux_a_venir
FROM public.ateliers a
LEFT JOIN public.sessions s ON s.atelier_id = a.id AND s.statut = 'ouverte' AND s.debut_le > now()
WHERE a.statut = 'publie'
GROUP BY 1, 2;
COMMENT ON VIEW prospection.offre_par_zone IS
  'Offre : par zone et savoir-faire, nombre d''ateliers publiés et de créneaux ouverts à venir. Minimisation RGPD : uniquement des COUNT, ni artisan, ni adresse d''atelier, ni identifiant.';

-- 3. Réservations confirmées des 60 derniers jours, par savoir-faire.
CREATE OR REPLACE VIEW prospection.reservations_par_savoir_faire AS
SELECT a.savoir_faire, count(*)::int AS nb_reservations_60_jours
FROM public.reservations r
JOIN public.sessions s ON s.id = r.session_id
JOIN public.ateliers a ON a.id = s.atelier_id
WHERE r.statut = 'confirmee' AND r.reservee_le >= now() - interval '60 days'
GROUP BY a.savoir_faire;
COMMENT ON VIEW prospection.reservations_par_savoir_faire IS
  'Réservations confirmées sur les 60 derniers jours, par savoir-faire (toutes zones). Minimisation RGPD : uniquement des COUNT, aucun élève, code de réservation ni identifiant.';

-- 4. Synthèse triée par priorité : des élèves intéressés là où l'offre est nulle ou faible.
CREATE OR REPLACE VIEW prospection.manques AS
WITH croise AS (
  SELECT d.zone, d.savoir_faire, d.nb_eleves AS nb_eleves_zone, d.nb_eleves_interesses,
         coalesce(o.nb_ateliers, 0) AS nb_ateliers, coalesce(o.nb_creneaux_a_venir, 0) AS nb_creneaux_a_venir,
         coalesce(r.nb_reservations_60_jours, 0) AS nb_reservations_60_jours
  FROM prospection.demande_par_zone d
  LEFT JOIN prospection.offre_par_zone o ON o.zone = d.zone AND o.savoir_faire = d.savoir_faire
  LEFT JOIN prospection.reservations_par_savoir_faire r ON r.savoir_faire = d.savoir_faire
),
priorise AS (
  SELECT c.*,
    CASE
      WHEN c.nb_ateliers = 0 THEN 'haute'
      WHEN c.nb_creneaux_a_venir < c.nb_eleves_interesses * 2 THEN 'moyenne'  -- moins de 2 créneaux par élève intéressé
      ELSE 'basse'
    END AS priorite
  FROM croise c
)
SELECT p.priorite, p.zone, prospection.libelle(p.savoir_faire, false) AS savoir_faire,
       p.nb_eleves_interesses, p.nb_eleves_zone, p.nb_ateliers, p.nb_creneaux_a_venir, p.nb_reservations_60_jours,
       p.nb_eleves_interesses || CASE WHEN p.nb_eleves_interesses > 1 THEN ' élèves aiment ' ELSE ' élève aime ' END
         || prospection.libelle(p.savoir_faire, true)
         || CASE WHEN p.zone LIKE 'Paris %' THEN ' dans le ' || substr(p.zone, 7) ELSE ' à ' || p.zone END
         || ', '
         || CASE
              WHEN p.nb_ateliers = 0 THEN 'aucun atelier de ' || prospection.libelle(p.savoir_faire, false)
              ELSE p.nb_ateliers || CASE WHEN p.nb_ateliers > 1 THEN ' ateliers de ' ELSE ' atelier de ' END
                   || prospection.libelle(p.savoir_faire, false) || ' (' || p.nb_creneaux_a_venir
                   || CASE WHEN p.nb_creneaux_a_venir > 1 THEN ' créneaux à venir)' ELSE ' créneau à venir)' END
            END
         || CASE WHEN p.nb_reservations_60_jours > 0
              THEN ' ; ' || p.nb_reservations_60_jours || ' réservation' || CASE WHEN p.nb_reservations_60_jours > 1 THEN 's' ELSE '' END
                   || ' en ' || prospection.libelle(p.savoir_faire, false) || ' sur 60 jours, toutes zones'
              ELSE '' END
         || '.' AS explication
FROM priorise p
ORDER BY CASE p.priorite WHEN 'haute' THEN 1 WHEN 'moyenne' THEN 2 ELSE 3 END,
         p.nb_eleves_interesses DESC, p.nb_reservations_60_jours DESC, p.zone, savoir_faire;
COMMENT ON VIEW prospection.manques IS
  'Synthèse pour la prospection : savoir-faire et zones où des élèves sont intéressés mais l''offre est nulle (priorité haute) ou faible (moyenne : moins de 2 créneaux à venir par élève intéressé). Minimisation RGPD : uniquement des agrégats issus des trois vues, aucune donnée personnelle.';

-- Aucun droit pour les rôles de l'API : le schéma n'est pas exposé et rien n'y est lisible.
REVOKE ALL ON SCHEMA prospection FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA prospection FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA prospection FROM PUBLIC, anon, authenticated;
