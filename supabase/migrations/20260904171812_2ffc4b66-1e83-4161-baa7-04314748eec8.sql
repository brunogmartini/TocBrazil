GRANT INSERT ON public.notifications TO authenticated;
CREATE POLICY "notif_own_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DELETE FROM public.appointments WHERE patient_id = '5403a672-b641-4e1f-a552-4475846f5747';