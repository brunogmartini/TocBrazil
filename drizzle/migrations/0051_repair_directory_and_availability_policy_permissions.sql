-- Boolean eligibility checks used by the public directory policy; no table access is granted.
GRANT EXECUTE ON FUNCTION private.professional_latest_review_approved(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.professional_contract_ready(uuid) TO anon;

CREATE OR REPLACE FUNCTION private.professional_can_manage_availability(_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR NOT private.owns_professional(_professional_id) THEN false
    ELSE public.professional_contract_ready(_professional_id)
      AND EXISTS (
        SELECT 1 FROM public.asaas_professional_accounts apa
        WHERE apa.professional_id = _professional_id
          AND apa.status = 'ativa' AND apa.wallet_id IS NOT NULL
      )
  END;
$$;
REVOKE ALL ON FUNCTION private.professional_can_manage_availability(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.professional_can_manage_availability(uuid) TO authenticated, service_role;

ALTER POLICY "eligible professionals manage availability rules"
ON public.availability_rules
USING (private.professional_can_manage_availability(professional_id))
WITH CHECK (private.professional_can_manage_availability(professional_id));

ALTER POLICY "eligible professionals manage availability blocks"
ON public.availability_blocks
USING (private.professional_can_manage_availability(professional_id))
WITH CHECK (private.professional_can_manage_availability(professional_id));

COMMENT ON FUNCTION private.professional_can_manage_availability(uuid) IS
'Owner-scoped boolean eligibility for availability policies; contract and active receiving required, financial rows remain inaccessible to client roles.';