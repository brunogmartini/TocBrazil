REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO service_role;