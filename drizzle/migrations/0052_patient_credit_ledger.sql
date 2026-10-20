-- Crédito do paciente: saldo gerado quando uma consulta não ocorre e parte do
-- valor cobrado (Pix, ou cartão na Opção 1) não é retida como taxa. O crédito
-- fica disponível na plataforma e é reembolsado ao paciente somente sob demanda.
-- Tabelas server-only, fail-closed: nenhum acesso direto de anon/authenticated.
-- O paciente lê o próprio saldo por server function (supabaseAdmin + ownership),
-- no mesmo padrão de asaas_professional_accounts.

CREATE TABLE public.patient_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
  environment text NOT NULL DEFAULT 'sandbox',
  amount_centavos integer NOT NULL,
  origin text NOT NULL,
  status text NOT NULL DEFAULT 'disponivel',
  -- Cobrança do provedor que originou o crédito, usada para o reembolso.
  provider_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_credits_environment_check CHECK (environment IN ('sandbox','production')),
  CONSTRAINT patient_credits_amount_check CHECK (amount_centavos > 0),
  CONSTRAINT patient_credits_origin_check CHECK (origin IN ('no_show_pix','no_show_cartao','ajuste_manual')),
  CONSTRAINT patient_credits_status_check CHECK (status IN ('disponivel','reembolsando','reembolsado','cancelado')),
  -- Um crédito por consulta (idempotência da liquidação).
  CONSTRAINT patient_credits_appointment_unique UNIQUE (appointment_id)
);
GRANT ALL ON public.patient_credits TO service_role;
REVOKE ALL ON public.patient_credits FROM anon, authenticated;
ALTER TABLE public.patient_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_credits FORCE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS patient_credits_patient_idx
  ON public.patient_credits (patient_id, status);
CREATE TRIGGER patient_credits_updated
  BEFORE UPDATE ON public.patient_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.patient_credit_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL REFERENCES public.patient_credits(id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  amount_centavos integer NOT NULL,
  status text NOT NULL DEFAULT 'solicitado',
  provider_refund_id text,
  failure_code text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_credit_refunds_environment_check CHECK (environment IN ('sandbox','production')),
  CONSTRAINT patient_credit_refunds_amount_check CHECK (amount_centavos > 0),
  CONSTRAINT patient_credit_refunds_status_check CHECK (status IN ('solicitado','processando','concluido','falhou')),
  -- No máximo um reembolso ativo por crédito (impede duplo pedido).
  CONSTRAINT patient_credit_refunds_credit_unique UNIQUE (credit_id)
);
GRANT ALL ON public.patient_credit_refunds TO service_role;
REVOKE ALL ON public.patient_credit_refunds FROM anon, authenticated;
ALTER TABLE public.patient_credit_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_credit_refunds FORCE ROW LEVEL SECURITY;
CREATE TRIGGER patient_credit_refunds_updated
  BEFORE UPDATE ON public.patient_credit_refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
