CREATE TABLE public.contrato_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versao text NOT NULL UNIQUE,
  titulo text NOT NULL,
  caminho text NOT NULL UNIQUE,
  arquivo_sha256 text NOT NULL,
  modo_assinatura text NOT NULL DEFAULT 'interno' CHECK (modo_assinatura IN ('interno', 'provedor')),
  provedor text,
  ativo boolean NOT NULL DEFAULT false,
  publicado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((modo_assinatura = 'interno' AND provedor IS NULL) OR (modo_assinatura = 'provedor' AND provedor IS NOT NULL))
);
GRANT SELECT ON public.contrato_versoes TO authenticated;
GRANT ALL ON public.contrato_versoes TO service_role;
ALTER TABLE public.contrato_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autenticados leem versao ativa do contrato"
ON public.contrato_versoes FOR SELECT TO authenticated
USING (ativo OR public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX contrato_versoes_uma_ativa_idx ON public.contrato_versoes (ativo) WHERE ativo;

ALTER TABLE public.contratos_profissionais
  ADD COLUMN IF NOT EXISTS contrato_versao_id uuid REFERENCES public.contrato_versoes(id),
  ADD COLUMN IF NOT EXISTS arquivo_sha256 text,
  ADD COLUMN IF NOT EXISTS crp text,
  ADD COLUMN IF NOT EXISTS crp_uf text,
  ADD COLUMN IF NOT EXISTS geolocalizacao_aproximada jsonb,
  ADD COLUMN IF NOT EXISTS identificador_dispositivo text,
  ADD COLUMN IF NOT EXISTS modo_assinatura text NOT NULL DEFAULT 'interno' CHECK (modo_assinatura IN ('interno', 'provedor')),
  ADD COLUMN IF NOT EXISTS provedor text,
  ADD COLUMN IF NOT EXISTS provedor_referencia text,
  ADD COLUMN IF NOT EXISTS provedor_evidencia jsonb,
  ADD COLUMN IF NOT EXISTS texto_aceite text,
  ADD COLUMN IF NOT EXISTS status_assinatura text NOT NULL DEFAULT 'aceita' CHECK (status_assinatura IN ('pendente', 'aceita', 'cancelada'));

COMMENT ON COLUMN public.contratos_profissionais.documento IS 'CPF registrado no momento do aceite; nome histórico preservado por compatibilidade.';
COMMENT ON COLUMN public.contratos_profissionais.geolocalizacao_aproximada IS 'Localização aproximada derivada de cabeçalhos da infraestrutura, sem coordenadas precisas.';
COMMENT ON COLUMN public.contratos_profissionais.identificador_dispositivo IS 'Hash específico do aceite, não reutilizado como identificador de rastreamento.';

REVOKE INSERT ON public.contratos_profissionais FROM authenticated;
GRANT SELECT ON public.contratos_profissionais TO authenticated;
GRANT ALL ON public.contratos_profissionais TO service_role;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS cadastro_conferido_em timestamptz,
  ADD COLUMN IF NOT EXISTS cadastro_conferido_por uuid;
COMMENT ON COLUMN public.professionals.cadastro_conferido_em IS 'Conferência documental concluída; a publicação ainda depende do contrato vigente aceito.';

CREATE OR REPLACE FUNCTION public.contratos_profissionais_imutaveis()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Registros de aceite eletrônico são imutáveis';
END;
$$;

DROP TRIGGER IF EXISTS contratos_profissionais_bloqueia_update ON public.contratos_profissionais;
CREATE TRIGGER contratos_profissionais_bloqueia_update
BEFORE UPDATE OR DELETE ON public.contratos_profissionais
FOR EACH ROW EXECUTE FUNCTION public.contratos_profissionais_imutaveis();

CREATE OR REPLACE FUNCTION public.professional_tem_contrato_ativo_aceito(_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contratos_profissionais cp
    JOIN public.contrato_versoes cv ON cv.id = cp.contrato_versao_id
    WHERE cp.professional_id = _professional_id
      AND cp.status_assinatura = 'aceita'
      AND cv.ativo = true
      AND cp.arquivo_sha256 = cv.arquivo_sha256
  )
$$;
REVOKE ALL ON FUNCTION public.professional_tem_contrato_ativo_aceito(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.professional_tem_contrato_ativo_aceito(uuid) TO authenticated, service_role;