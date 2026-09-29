ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text;

COMMENT ON COLUMN public.profiles.cpf IS 'CPF privado usado para identificação do cliente no provedor de pagamento e documentação fiscal.';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS asaas_payment_id_a text,
  ADD COLUMN IF NOT EXISTS asaas_payment_id_b text,
  ADD COLUMN IF NOT EXISTS auth_status_a text,
  ADD COLUMN IF NOT EXISTS auth_status_b text,
  ADD COLUMN IF NOT EXISTS authorized_at timestamptz,
  ADD COLUMN IF NOT EXISTS auth_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS settlement_status text NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN IF NOT EXISTS settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS amount_captured_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_amount_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS professional_amount_centavos integer NOT NULL DEFAULT 0;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_asaas_outcome_check CHECK (
    outcome IS NULL OR outcome IN ('REALIZADA','FALTA_PACIENTE','FALTA_PROFISSIONAL','CANCELADA_COM_ANTECEDENCIA','CANCELADA_TARDIA','FORCA_MAIOR')
  ) NOT VALID,
  ADD CONSTRAINT appointments_asaas_settlement_status_check CHECK (
    settlement_status IN ('PENDENTE','PROCESSANDO','EXECUTADO','FALHOU')
  ) NOT VALID,
  ADD CONSTRAINT appointments_asaas_amounts_nonnegative_check CHECK (
    amount_captured_centavos >= 0 AND platform_amount_centavos >= 0 AND professional_amount_centavos >= 0
  ) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_asaas_payment_a_unique
  ON public.appointments (asaas_payment_id_a) WHERE asaas_payment_id_a IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_asaas_payment_b_unique
  ON public.appointments (asaas_payment_id_b) WHERE asaas_payment_id_b IS NOT NULL;

CREATE TABLE public.asaas_professional_accounts (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'sandbox',
  asaas_account_id text,
  wallet_id text,
  api_key_ciphertext text,
  status text NOT NULL DEFAULT 'pendente',
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asaas_professional_accounts_environment_check CHECK (environment IN ('sandbox','production')),
  CONSTRAINT asaas_professional_accounts_status_check CHECK (status IN ('pendente','ativa','falhou','bloqueada'))
);
GRANT ALL ON public.asaas_professional_accounts TO service_role;
REVOKE ALL ON public.asaas_professional_accounts FROM anon, authenticated;
ALTER TABLE public.asaas_professional_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_professional_accounts FORCE ROW LEVEL SECURITY;
CREATE TRIGGER asaas_professional_accounts_updated
  BEFORE UPDATE ON public.asaas_professional_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  asaas_customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asaas_customers_environment_check CHECK (environment IN ('sandbox','production')),
  CONSTRAINT asaas_customers_user_environment_unique UNIQUE (user_id, environment),
  CONSTRAINT asaas_customers_provider_unique UNIQUE (environment, asaas_customer_id)
);
GRANT ALL ON public.asaas_customers TO service_role;
REVOKE ALL ON public.asaas_customers FROM anon, authenticated;
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_customers FORCE ROW LEVEL SECURITY;
CREATE TRIGGER asaas_customers_updated
  BEFORE UPDATE ON public.asaas_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.asaas_payment_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
  portion text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  provider_payment_id text NOT NULL,
  idempotency_key text NOT NULL,
  amount_centavos integer NOT NULL,
  platform_amount_centavos integer NOT NULL,
  professional_amount_centavos integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  provider_status text,
  authorized_at timestamptz,
  expires_at timestamptz,
  captured_at timestamptz,
  canceled_at timestamptz,
  refunded_at timestamptz,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asaas_payment_authorizations_portion_check CHECK (portion IN ('A','B')),
  CONSTRAINT asaas_payment_authorizations_environment_check CHECK (environment IN ('sandbox','production')),
  CONSTRAINT asaas_payment_authorizations_amounts_check CHECK (amount_centavos > 0 AND platform_amount_centavos >= 0 AND professional_amount_centavos >= 0 AND platform_amount_centavos + professional_amount_centavos = amount_centavos),
  CONSTRAINT asaas_payment_authorizations_appointment_portion_unique UNIQUE (appointment_id, portion),
  CONSTRAINT asaas_payment_authorizations_provider_unique UNIQUE (environment, provider_payment_id),
  CONSTRAINT asaas_payment_authorizations_idempotency_unique UNIQUE (environment, idempotency_key)
);
GRANT ALL ON public.asaas_payment_authorizations TO service_role;
REVOKE ALL ON public.asaas_payment_authorizations FROM anon, authenticated;
ALTER TABLE public.asaas_payment_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_payment_authorizations FORCE ROW LEVEL SECURITY;
CREATE TRIGGER asaas_payment_authorizations_updated
  BEFORE UPDATE ON public.asaas_payment_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.asaas_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  provider_payment_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'recebido',
  failure_code text,
  CONSTRAINT asaas_webhook_events_environment_check CHECK (environment IN ('sandbox','production')),
  CONSTRAINT asaas_webhook_events_status_check CHECK (status IN ('recebido','processado','ignorado','falhou')),
  CONSTRAINT asaas_webhook_events_unique UNIQUE (environment, event_id)
);
GRANT ALL ON public.asaas_webhook_events TO service_role;
REVOKE ALL ON public.asaas_webhook_events FROM anon, authenticated;
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_webhook_events FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.mercadopago_contas IS 'DEPRECATED: integração ativa substituída pelo Asaas; preservada somente para histórico.';