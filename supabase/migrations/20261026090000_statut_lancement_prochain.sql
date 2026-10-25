-- M5 - Ateliers « Lancement prochainement » (PRD F20).
-- Nouveau statut choisi par Creazio uniquement : un artisan ne peut ni l'écrire (statut absent de ses droits de
-- colonne en modification, insertion forcée en « en_verification » par prive.proteger_prix_atelier) ni réserver
-- dessus. Les élèves connectés voient la carte (titre, artisan, lieu, durée) mais aucun créneau : les sessions
-- ne sont lisibles que pour les ateliers publiés, reserver_session exige « publie », et l'assistant IA comme les
-- recommandations ne lisent que les ateliers publiés.
-- À exécuter en deux temps : une nouvelle valeur d'enum doit être validée avant d'être utilisée.

-- 1.
ALTER TYPE public.statut_atelier ADD VALUE IF NOT EXISTS 'lancement_prochain';

-- 2.
DROP POLICY IF EXISTS "Ateliers en lancement visibles par les utilisateurs connectés" ON public.ateliers;
CREATE POLICY "Ateliers en lancement visibles par les utilisateurs connectés" ON public.ateliers
  FOR SELECT TO authenticated USING (statut = 'lancement_prochain');
