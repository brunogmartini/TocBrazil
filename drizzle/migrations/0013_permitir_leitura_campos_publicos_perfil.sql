GRANT SELECT (
  abordagens_publicas, formacoes_publicas, temas_toc_publicos, biografia_publica
) ON public.professionals TO anon;

CREATE OR REPLACE FUNCTION public.perfil_pronto_para_publicar(_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = _professional_id
      AND length(trim(p.nome)) >= 3
      AND length(trim(p.registro)) >= 3
      AND length(trim(p.uf)) = 2
      AND p.foto_caminho IS NOT NULL
      AND p.foto_status = 'aprovada'
      AND cardinality(p.abordagens_publicas) BETWEEN 1 AND 3
      AND jsonb_array_length(p.formacoes_publicas) >= 1
      AND cardinality(p.temas_toc_publicos) >= 1
      AND length(trim(COALESCE(p.biografia_publica, ''))) BETWEEN 20 AND 600
      AND p.valor_centavos > 0
      AND p.slot_minutos > 0
      AND cardinality(p.idiomas) >= 1
      AND p.ferramenta_url_sala IS NOT NULL
  );
$function$;
REVOKE ALL ON FUNCTION public.perfil_pronto_para_publicar(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.perfil_pronto_para_publicar(uuid) TO service_role;