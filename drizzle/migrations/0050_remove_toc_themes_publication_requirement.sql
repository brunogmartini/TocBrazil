DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.perfil_pronto_para_publicar(uuid)'::regprocedure);
  d := replace(d, 'AND cardinality(p.temas_toc_publicos) >= 1', '');
  EXECUTE d;
END $$;
REVOKE ALL ON FUNCTION public.perfil_pronto_para_publicar(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.perfil_pronto_para_publicar(uuid) TO service_role;
COMMENT ON COLUMN public.professionals.temas_toc_publicos IS 'DEPRECATED: TOC themes are no longer collected or shown publicly';