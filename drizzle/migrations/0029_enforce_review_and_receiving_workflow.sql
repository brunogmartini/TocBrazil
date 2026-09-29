CREATE OR REPLACE FUNCTION public.record_professional_review_decision(
  _professional_id uuid,
  _decided_by uuid,
  _decision text,
  _checklist jsonb,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _decision NOT IN ('approved', 'correction_requested', 'rejected') THEN
    RAISE EXCEPTION 'Decisão inválida';
  END IF;

  INSERT INTO public.professional_review_decisions (
    professional_id, decided_by, decision, checklist, reason
  ) VALUES (
    _professional_id, _decided_by, _decision, COALESCE(_checklist, '{}'::jsonb), _reason
  );

  IF _decision = 'approved' THEN
    UPDATE public.professionals
    SET cadastro_conferido_em = now(),
        cadastro_conferido_por = _decided_by,
        observacao_admin = NULL,
        status = 'pendente',
        requer_correcao = false,
        validado_em = now(),
        validado_por = _decided_by
    WHERE id = _professional_id;
  ELSIF _decision = 'correction_requested' THEN
    UPDATE public.professionals
    SET cadastro_conferido_em = NULL,
        cadastro_conferido_por = NULL,
        observacao_admin = _reason,
        status = 'pendente',
        requer_correcao = true,
        validado_em = now(),
        validado_por = _decided_by
    WHERE id = _professional_id;
  ELSE
    UPDATE public.professionals
    SET cadastro_conferido_em = NULL,
        cadastro_conferido_por = NULL,
        observacao_admin = _reason,
        status = 'rejeitado',
        requer_correcao = false,
        validado_em = now(),
        validado_por = _decided_by
    WHERE id = _professional_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.record_professional_review_decision(uuid, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_professional_review_decision(uuid, uuid, text, jsonb, text) TO service_role;

DROP POLICY IF EXISTS "accepted professionals manage availability rules" ON public.availability_rules;
CREATE POLICY "eligible professionals manage availability rules"
ON public.availability_rules FOR ALL TO authenticated
USING (
  private.owns_professional(professional_id)
  AND public.professional_contract_ready(professional_id)
  AND EXISTS (
    SELECT 1 FROM public.asaas_professional_accounts apa
    WHERE apa.professional_id = availability_rules.professional_id
      AND apa.status = 'ativa'
      AND apa.wallet_id IS NOT NULL
  )
)
WITH CHECK (
  private.owns_professional(professional_id)
  AND public.professional_contract_ready(professional_id)
  AND EXISTS (
    SELECT 1 FROM public.asaas_professional_accounts apa
    WHERE apa.professional_id = availability_rules.professional_id
      AND apa.status = 'ativa'
      AND apa.wallet_id IS NOT NULL
  )
);

DROP POLICY IF EXISTS "accepted professionals manage availability blocks" ON public.availability_blocks;
CREATE POLICY "eligible professionals manage availability blocks"
ON public.availability_blocks FOR ALL TO authenticated
USING (
  private.owns_professional(professional_id)
  AND public.professional_contract_ready(professional_id)
  AND EXISTS (
    SELECT 1 FROM public.asaas_professional_accounts apa
    WHERE apa.professional_id = availability_blocks.professional_id
      AND apa.status = 'ativa'
      AND apa.wallet_id IS NOT NULL
  )
)
WITH CHECK (
  private.owns_professional(professional_id)
  AND public.professional_contract_ready(professional_id)
  AND EXISTS (
    SELECT 1 FROM public.asaas_professional_accounts apa
    WHERE apa.professional_id = availability_blocks.professional_id
      AND apa.status = 'ativa'
      AND apa.wallet_id IS NOT NULL
  )
);