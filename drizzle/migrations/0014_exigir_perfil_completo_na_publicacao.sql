DROP POLICY IF EXISTS prof_public_select ON public.professionals;
CREATE POLICY prof_public_select
  ON public.professionals
  FOR SELECT
  TO anon
  USING (
    status = 'aprovado'
    AND foto_status = 'aprovada'
    AND foto_caminho IS NOT NULL
    AND cardinality(abordagens_publicas) BETWEEN 1 AND 3
    AND jsonb_array_length(formacoes_publicas) >= 1
    AND cardinality(temas_toc_publicos) >= 1
    AND length(trim(COALESCE(biografia_publica, ''))) BETWEEN 20 AND 600
    AND valor_centavos > 0
    AND cardinality(idiomas) >= 1
  );