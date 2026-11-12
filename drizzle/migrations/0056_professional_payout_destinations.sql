COMMENT ON TABLE public.professional_payout_details IS 'DEPRECATED: legacy payout fields, unused by application code; replaced by professional_payout_destinations.';

CREATE TABLE public.professional_payout_destinations (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  metodo text NOT NULL CHECK (metodo IN ('pix','banco')),
  pix_tipo text CHECK (pix_tipo IN ('cpf','cnpj','email','telefone','aleatoria')),
  pix_chave text CHECK (pix_chave IS NULL OR length(pix_chave) BETWEEN 3 AND 120),
  banco_codigo text CHECK (banco_codigo IS NULL OR banco_codigo ~ '^[0-9]{3}$'),
  agencia text CHECK (agencia IS NULL OR agencia ~ '^[0-9]{1,5}$'),
  conta text CHECK (conta IS NULL OR conta ~ '^[0-9]{1,12}-[0-9X]$'),
  tipo_conta text CHECK (tipo_conta IS NULL OR tipo_conta IN ('corrente','poupanca')),
  titular_nome text NOT NULL CHECK (length(btrim(titular_nome)) BETWEEN 3 AND 120),
  titular_documento text NOT NULL CHECK (titular_documento ~ '^([0-9]{11}|[0-9]{14})$'),
  conferido_em timestamptz,
  conferido_por uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_payout_destinations_metodo_campos CHECK (
    (metodo = 'pix' AND pix_tipo IS NOT NULL AND pix_chave IS NOT NULL AND banco_codigo IS NULL AND agencia IS NULL AND conta IS NULL AND tipo_conta IS NULL)
    OR (metodo = 'banco' AND pix_tipo IS NULL AND pix_chave IS NULL AND banco_codigo IS NOT NULL AND agencia IS NOT NULL AND conta IS NOT NULL AND tipo_conta IS NOT NULL)
  )
);
COMMENT ON TABLE public.professional_payout_destinations IS 'Server-only payout destination (Pix or bank account) for manual repasse; management verification required before publication.';
GRANT ALL ON public.professional_payout_destinations TO service_role;
REVOKE ALL ON public.professional_payout_destinations FROM anon, authenticated;
ALTER TABLE public.professional_payout_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_payout_destinations FORCE ROW LEVEL SECURITY;
CREATE POLICY professional_payout_destinations_deny_clients ON public.professional_payout_destinations AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION private.professional_payout_reset_verification()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp' AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.conferido_em := NULL; NEW.conferido_por := NULL;
  ELSIF (NEW.metodo, NEW.pix_tipo, NEW.pix_chave, NEW.banco_codigo, NEW.agencia, NEW.conta, NEW.tipo_conta, NEW.titular_nome, NEW.titular_documento)
        IS DISTINCT FROM (OLD.metodo, OLD.pix_tipo, OLD.pix_chave, OLD.banco_codigo, OLD.agencia, OLD.conta, OLD.tipo_conta, OLD.titular_nome, OLD.titular_documento) THEN
    NEW.conferido_em := NULL; NEW.conferido_por := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER professional_payout_reset_verification
  BEFORE INSERT OR UPDATE ON public.professional_payout_destinations
  FOR EACH ROW EXECUTE FUNCTION private.professional_payout_reset_verification();

CREATE OR REPLACE FUNCTION private.professional_payout_verified(_professional_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'private', 'pg_temp' AS $$
  SELECT EXISTS (SELECT 1 FROM public.professional_payout_destinations d WHERE d.professional_id = _professional_id AND d.conferido_em IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION private.professional_payout_verified(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.professional_payout_verified(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.professional_payment_and_schedule_ready(_professional_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'private' AS $$
  SELECT private.professional_payout_verified(_professional_id)
    AND EXISTS (SELECT 1 FROM public.availability_rules ar WHERE ar.professional_id = _professional_id);
$$;

CREATE OR REPLACE FUNCTION private.professional_can_manage_availability(_professional_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'private', 'pg_temp' AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR NOT private.owns_professional(_professional_id) THEN false
    ELSE public.professional_contract_ready(_professional_id)
      AND private.professional_payout_verified(_professional_id)
  END;
$$;

ALTER POLICY "public reads fully eligible professionals" ON public.professionals USING (
  (status = 'aprovado'::prof_status) AND private.professional_latest_review_approved(id)
  AND (foto_status = 'aprovada'::text) AND (foto_caminho IS NOT NULL)
  AND ((cardinality(abordagens_publicas) >= 1) AND (cardinality(abordagens_publicas) <= 3))
  AND (jsonb_array_length(formacoes_publicas) >= 1)
  AND ((length(TRIM(BOTH FROM COALESCE(biografia_publica, ''::text))) >= 20) AND (length(TRIM(BOTH FROM COALESCE(biografia_publica, ''::text))) <= 600))
  AND (valor_centavos > 0) AND (cardinality(idiomas) >= 1)
  AND professional_contract_ready(id) AND private.professional_payment_and_schedule_ready(id)
);