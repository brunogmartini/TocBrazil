REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_professional(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.horarios_ocupados(uuid, timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_professional(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.horarios_ocupados(uuid, timestamptz, timestamptz) TO anon, authenticated, service_role;