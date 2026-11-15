REVOKE ALL ON public.appointment_attendance_reports FROM anon;
REVOKE INSERT,UPDATE,DELETE ON public.appointment_attendance_reports FROM authenticated;
GRANT SELECT ON public.appointment_attendance_reports TO authenticated;
GRANT ALL ON public.appointment_attendance_reports TO service_role;