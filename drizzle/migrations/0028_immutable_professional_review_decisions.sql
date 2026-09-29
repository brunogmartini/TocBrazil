CREATE TABLE public.professional_review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  decided_by uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'correction_requested', 'rejected')),
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_review_decisions_checklist_object CHECK (jsonb_typeof(checklist) = 'object'),
  CONSTRAINT professional_review_decisions_reason_required CHECK (
    (decision = 'approved' AND reason IS NULL)
    OR (decision IN ('correction_requested', 'rejected') AND length(trim(COALESCE(reason, ''))) > 0)
  ),
  CONSTRAINT professional_review_decisions_approval_complete CHECK (
    decision <> 'approved'
    OR (
      checklist @> '{"identity_matches": true, "crp_active": true, "certificate_valid": true, "diploma_matches": true, "annex_v_compliant": true}'::jsonb
    )
  )
);
GRANT ALL ON public.professional_review_decisions TO service_role;
REVOKE ALL ON public.professional_review_decisions FROM anon, authenticated;
ALTER TABLE public.professional_review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_review_decisions FORCE ROW LEVEL SECURITY;
CREATE POLICY professional_review_decisions_deny_client_access
ON public.professional_review_decisions FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.professional_review_decisions_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Decisões de conferência profissional são imutáveis';
END;
$$;
CREATE TRIGGER professional_review_decisions_immutable
BEFORE UPDATE OR DELETE ON public.professional_review_decisions
FOR EACH ROW EXECUTE FUNCTION public.professional_review_decisions_immutable();

CREATE OR REPLACE FUNCTION private.professional_latest_review_approved(_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE((
    SELECT decision = 'approved'
    FROM public.professional_review_decisions
    WHERE professional_id = _professional_id
    ORDER BY decided_at DESC, id DESC
    LIMIT 1
  ), false);
$$;
REVOKE ALL ON FUNCTION private.professional_latest_review_approved(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.professional_latest_review_approved(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "profissional le contrato ativo" ON storage.objects;
CREATE POLICY "approved professional reads active contract"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contratos-profissionais'
  AND EXISTS (
    SELECT 1
    FROM public.contract_documents cd
    JOIN public.professionals p ON p.user_id = auth.uid()
    WHERE cd.storage_path = storage.objects.name
      AND cd.active = true
      AND private.professional_latest_review_approved(p.id)
  )
);

CREATE OR REPLACE FUNCTION public.professional_contract_ready(_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professionals p
    JOIN public.document_acceptances a
      ON a.professional_id = p.id
     AND a.user_id = p.user_id
    JOIN public.contract_documents c
      ON c.contract_version = a.contract_version
     AND c.document_key = 'contract'
     AND c.active
     AND c.sha256 = a.contract_sha256
    WHERE p.id = _professional_id
      AND private.professional_latest_review_approved(p.id)
      AND jsonb_array_length(a.declarations) = 7
      AND a.annex_hashes ?& ARRAY['annex_i', 'annex_iii', 'annex_iv', 'annex_v']
      AND NOT EXISTS (
        SELECT 1
        FROM public.contract_documents required_doc
        WHERE required_doc.contract_version = c.contract_version
          AND required_doc.active
          AND required_doc.required_before_acceptance
          AND required_doc.document_key <> 'contract'
          AND (
            NOT (a.annex_hashes ? required_doc.document_key)
            OR a.annex_hashes ->> required_doc.document_key <> required_doc.sha256
            OR NOT EXISTS (
              SELECT 1 FROM public.document_accesses da
              WHERE da.user_id = p.user_id
                AND da.professional_id = p.id
                AND da.contract_version = c.contract_version
                AND da.document_key = required_doc.document_key
                AND da.document_sha256 = required_doc.sha256
            )
          )
      )
  );
$$;
REVOKE ALL ON FUNCTION public.professional_contract_ready(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.professional_contract_ready(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "public reads fully eligible professionals" ON public.professionals;
CREATE POLICY "public reads fully eligible professionals"
ON public.professionals FOR SELECT TO anon, authenticated
USING (
  status = 'aprovado'
  AND private.professional_latest_review_approved(id)
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

COMMENT ON TABLE public.professional_review_decisions IS 'Histórico imutável das decisões administrativas de credenciamento; revisões geram novas linhas.';