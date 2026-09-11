REVOKE SELECT ON public.professionals FROM anon, authenticated;

GRANT SELECT (
  id, user_id, slug, nome, profissao, registro, uf, foto_url, abordagem, apresentacao,
  experiencia_toc, experiencia_anos, formacao, especializacoes, areas, idiomas, genero,
  status, comissao_percent, slot_minutos, created_at, updated_at, valor_centavos, cidade,
  destaque, mp_user_id, mp_vinculado_em, graduacao, instituicao, cursos, observacao_admin,
  validado_em, validado_por, requer_correcao
) ON public.professionals TO anon, authenticated;

GRANT ALL ON public.professionals TO service_role;