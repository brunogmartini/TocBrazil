REVOKE INSERT, UPDATE, DELETE ON public.document_accesses FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.document_acceptances FROM authenticated;
GRANT SELECT ON public.document_accesses TO authenticated;
GRANT SELECT ON public.document_acceptances TO authenticated;
GRANT ALL ON public.document_accesses TO service_role;
GRANT ALL ON public.document_acceptances TO service_role;

DROP POLICY IF EXISTS document_accesses_insert_own ON public.document_accesses;
DROP POLICY IF EXISTS document_acceptances_insert_own ON public.document_acceptances;

CREATE POLICY document_accesses_server_only
ON public.document_accesses FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY document_acceptances_server_only
ON public.document_acceptances FOR INSERT TO authenticated
WITH CHECK (false);

ALTER TABLE public.document_accesses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_acceptances FORCE ROW LEVEL SECURITY;

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
    JOIN public.document_acceptances a
      ON a.professional_id = p.id
     AND a.user_id = p.user_id
    JOIN public.contract_documents c
      ON c.contract_version = a.contract_version
     AND c.document_key = 'contract'
     AND c.active
     AND c.sha256 = a.contract_sha256
    WHERE p.id = _professional_id
      AND p.cadastro_conferido_em IS NOT NULL
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