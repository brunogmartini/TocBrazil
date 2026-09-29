CREATE TABLE public.asaas_sandbox_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  label text NOT NULL,
  subaccount_id text,
  wallet_id text,
  customer_id text,
  payment_id_a text,
  payment_id_b text,
  status_a text,
  status_b text,
  total_centavos integer NOT NULL DEFAULT 10000,
  platform_a_centavos integer NOT NULL DEFAULT 1000,
  platform_b_centavos integer NOT NULL DEFAULT 1700,
  last_action text NOT NULL DEFAULT 'criado',
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asaas_sandbox_test_total_check CHECK (total_centavos >= 6700),
  CONSTRAINT asaas_sandbox_test_split_check CHECK (platform_a_centavos = 1000 AND platform_b_centavos = 1700)
);
GRANT ALL ON public.asaas_sandbox_test_runs TO service_role;
REVOKE ALL ON public.asaas_sandbox_test_runs FROM anon, authenticated;
ALTER TABLE public.asaas_sandbox_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_sandbox_test_runs FORCE ROW LEVEL SECURITY;
CREATE TRIGGER asaas_sandbox_test_runs_updated
  BEFORE UPDATE ON public.asaas_sandbox_test_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE public.asaas_sandbox_test_runs IS 'Execuções administrativas isoladas para validação do Asaas Sandbox; nunca vinculadas a pacientes ou agendamentos reais.';