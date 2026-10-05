GRANT SELECT (
  id,
  slug,
  nome,
  profissao,
  registro,
  uf,
  abordagens_publicas,
  biografia_publica,
  temas_toc_publicos,
  formacoes_publicas,
  experiencia_anos,
  areas,
  idiomas,
  genero,
  slot_minutos,
  valor_centavos,
  status
) ON public.professionals TO anon;
