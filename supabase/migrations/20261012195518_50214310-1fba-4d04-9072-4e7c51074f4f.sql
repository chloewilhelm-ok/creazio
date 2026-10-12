REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.participants_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.participants_session(uuid) TO authenticated;

GRANT SELECT, INSERT ON public.signalements_litiges TO authenticated;
GRANT ALL ON public.signalements_litiges TO service_role;
CREATE POLICY "litiges_select_own" ON public.signalements_litiges FOR SELECT TO authenticated
  USING (signale_par_eleve_id = auth.uid());
CREATE POLICY "litiges_insert_own" ON public.signalements_litiges FOR INSERT TO authenticated
  WITH CHECK (
    signale_par_eleve_id = auth.uid()
    AND statut = 'ouvert'
    AND credits_recredites = 0
    AND decision_le IS NULL AND decision_note IS NULL
    AND EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_id AND r.eleve_id = auth.uid())
  );