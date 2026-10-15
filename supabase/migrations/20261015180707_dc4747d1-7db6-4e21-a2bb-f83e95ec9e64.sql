UPDATE public.artisans
SET candidature_validee_le = now(), contrat_signe_le = now()
WHERE profile_id = '6096513d-6fc5-4791-9274-dce70cab9a9e'
  AND statut_candidature = 'validee'
  AND (candidature_validee_le IS NULL OR contrat_signe_le IS NULL);