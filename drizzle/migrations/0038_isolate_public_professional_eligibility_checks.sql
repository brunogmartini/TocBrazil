CREATE OR REPLACE FUNCTION private.professional_payment_and_schedule_ready(_professional_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT EXISTS (SELECT 1 FROM public.asaas_professional_accounts apa WHERE apa.professional_id = _professional_id AND apa.status = 'ativa' AND apa.wallet_id IS NOT NULL)
    AND EXISTS (SELECT 1 FROM public.availability_rules ar WHERE ar.professional_id = _professional_id);
$$;
REVOKE ALL ON FUNCTION private.professional_payment_and_schedule_ready(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.professional_payment_and_schedule_ready(uuid) TO anon, authenticated;
DROP POLICY "public reads fully eligible professionals" ON public.professionals;
CREATE POLICY "public reads fully eligible professionals" ON public.professionals FOR SELECT TO anon, authenticated USING (
  status = 'aprovado' AND private.professional_latest_review_approved(id)
  AND foto_status = 'aprovada' AND foto_caminho IS NOT NULL
  AND cardinality(abordagens_publicas) BETWEEN 1 AND 3
  AND jsonb_array_length(formacoes_publicas) >= 1 AND cardinality(temas_toc_publicos) >= 1
  AND length(trim(coalesce(biografia_publica, ''))) BETWEEN 20 AND 600
  AND valor_centavos > 0 AND cardinality(idiomas) >= 1
  AND public.professional_contract_ready(id)
  AND private.professional_payment_and_schedule_ready(id)
);