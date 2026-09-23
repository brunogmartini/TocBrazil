-- Separa a vitrine anonima do acesso autenticado a cadastros proprios.
REVOKE SELECT ON public.professionals FROM authenticated;
REVOKE SELECT (
  id, user_id, slug, nome, profissao, registro, uf, foto_url, abordagem, apresentacao,
  experiencia_toc, experiencia_anos, formacao, especializacoes, areas, idiomas, genero,
  status, comissao_percent, slot_minutos, created_at, updated_at, valor_centavos, cidade,
  destaque, mp_user_id, mp_vinculado_em, graduacao, instituicao, cursos,
  observacao_admin, validado_em, validado_por, requer_correcao
) ON public.professionals FROM authenticated;
GRANT SELECT ON public.professionals TO authenticated;

DROP POLICY IF EXISTS prof_public_select ON public.professionals;
CREATE POLICY prof_public_select
  ON public.professionals
  FOR SELECT
  TO anon
  USING (status = 'aprovado');

-- Dados publicos minimos do profissional ligados as consultas do paciente atual.
CREATE OR REPLACE FUNCTION public.profissionais_das_minhas_consultas()
RETURNS TABLE(
  id uuid,
  nome text,
  profissao public.profissao,
  slug text,
  registro text,
  ferramenta_provedor text,
  ferramenta_instrucoes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
  SELECT DISTINCT
    p.id,
    p.nome,
    p.profissao,
    p.slug,
    p.registro,
    p.ferramenta_provedor,
    p.ferramenta_instrucoes
  FROM public.professionals p
  JOIN public.appointments a ON a.professional_id = p.id
  WHERE a.patient_id = auth.uid();
$function$;
REVOKE ALL ON FUNCTION public.profissionais_das_minhas_consultas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profissionais_das_minhas_consultas() TO authenticated, service_role;