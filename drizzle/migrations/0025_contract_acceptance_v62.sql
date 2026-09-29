CREATE TABLE public.contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_version text NOT NULL,
  document_key text NOT NULL,
  display_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  display_order integer NOT NULL DEFAULT 0,
  required_before_acceptance boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_version, document_key)
);
GRANT SELECT ON public.contract_documents TO anon, authenticated;
GRANT ALL ON public.contract_documents TO service_role;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY "public reads active contract manifest"
ON public.contract_documents FOR SELECT TO anon, authenticated
USING (active = true);

CREATE TABLE public.document_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  contract_version text NOT NULL,
  document_key text NOT NULL,
  document_sha256 text NOT NULL CHECK (document_sha256 ~ '^[0-9a-f]{64}$'),
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip inet,
  user_agent text,
  UNIQUE (user_id, contract_version, document_key)
);
GRANT SELECT, INSERT ON public.document_accesses TO authenticated;
GRANT ALL ON public.document_accesses TO service_role;
ALTER TABLE public.document_accesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_accesses FORCE ROW LEVEL SECURITY;
CREATE POLICY "professional reads own document accesses"
ON public.document_accesses FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "approved professional records own document accesses"
ON public.document_accesses FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
      AND p.user_id = auth.uid()
      AND p.cadastro_conferido_em IS NOT NULL
  )
);

CREATE TABLE public.document_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  contract_version text NOT NULL,
  contract_sha256 text NOT NULL CHECK (contract_sha256 ~ '^[0-9a-f]{64}$'),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  scroll_completed_at timestamptz NOT NULL,
  declarations jsonb NOT NULL,
  annex_hashes jsonb NOT NULL,
  ip inet,
  user_agent text,
  geo_country text,
  geo_region text,
  geo_city text,
  evidence_sha256 text NOT NULL CHECK (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, contract_version)
);
GRANT SELECT, INSERT ON public.document_acceptances TO authenticated;
GRANT ALL ON public.document_acceptances TO service_role;
ALTER TABLE public.document_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_acceptances FORCE ROW LEVEL SECURITY;
CREATE POLICY "professional reads own document acceptance"
ON public.document_acceptances FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "approved professional records own document acceptance"
ON public.document_acceptances FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
      AND p.user_id = auth.uid()
      AND p.cadastro_conferido_em IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION public.contract_evidence_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Registros de leitura e aceite contratual são imutáveis';
END;
$$;
CREATE TRIGGER document_accesses_immutable
BEFORE UPDATE OR DELETE ON public.document_accesses
FOR EACH ROW EXECUTE FUNCTION public.contract_evidence_immutable();
CREATE TRIGGER document_acceptances_immutable
BEFORE UPDATE OR DELETE ON public.document_acceptances
FOR EACH ROW EXECUTE FUNCTION public.contract_evidence_immutable();

CREATE OR REPLACE FUNCTION public.professional_contract_ready(_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professionals p
    JOIN public.document_acceptances da ON da.professional_id = p.id AND da.user_id = p.user_id
    WHERE p.id = _professional_id
      AND p.cadastro_conferido_em IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.contract_documents cd
        WHERE cd.active = true
          AND cd.document_key = 'contract'
          AND cd.contract_version = da.contract_version
          AND cd.sha256 = da.contract_sha256
      )
  );
$$;
REVOKE ALL ON FUNCTION public.professional_contract_ready(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.professional_contract_ready(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS rules_own_all ON public.availability_rules;
CREATE POLICY "accepted professionals manage availability rules"
ON public.availability_rules FOR ALL TO authenticated
USING (private.owns_professional(professional_id) AND public.professional_contract_ready(professional_id))
WITH CHECK (private.owns_professional(professional_id) AND public.professional_contract_ready(professional_id));
DROP POLICY IF EXISTS blocks_own_all ON public.availability_blocks;
CREATE POLICY "accepted professionals manage availability blocks"
ON public.availability_blocks FOR ALL TO authenticated
USING (private.owns_professional(professional_id) AND public.professional_contract_ready(professional_id))
WITH CHECK (private.owns_professional(professional_id) AND public.professional_contract_ready(professional_id));

DROP POLICY IF EXISTS prof_public_select ON public.professionals;
CREATE POLICY "public reads fully eligible professionals"
ON public.professionals FOR SELECT TO anon, authenticated
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
  AND public.professional_contract_ready(id)
  AND EXISTS (
    SELECT 1 FROM public.asaas_professional_accounts apa
    WHERE apa.professional_id = professionals.id
      AND apa.status = 'ativa'
      AND apa.wallet_id IS NOT NULL
  )
  AND EXISTS (
    SELECT 1 FROM public.availability_rules ar
    WHERE ar.professional_id = professionals.id
  )
);

COMMENT ON TABLE public.contract_documents IS 'Manifesto versionado dos PDFs contratuais originais, identificados por SHA-256.';
COMMENT ON TABLE public.document_accesses IS 'Evidência imutável de abertura individual dos anexos contratuais.';
COMMENT ON TABLE public.document_acceptances IS 'Aceite eletrônico imutável, com declarações individualizadas e evidência do documento exibido.';
COMMENT ON COLUMN public.professionals.apolice_validade IS 'DEPRECATED: seguro profissional deixou de ser solicitado no credenciamento.';
COMMENT ON COLUMN public.professionals.seguradora_nome IS 'DEPRECATED: seguro profissional deixou de ser solicitado no credenciamento.';
COMMENT ON COLUMN public.professionals.apolice_numero IS 'DEPRECATED: seguro profissional deixou de ser solicitado no credenciamento.';