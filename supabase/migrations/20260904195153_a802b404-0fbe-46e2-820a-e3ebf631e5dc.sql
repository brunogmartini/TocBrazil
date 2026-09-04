ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS mp_user_id text,
  ADD COLUMN IF NOT EXISTS mp_vinculado_em timestamptz;

CREATE TABLE IF NOT EXISTS public.mercadopago_contas (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  mp_user_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  public_key text,
  expira_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.mercadopago_contas TO service_role;
ALTER TABLE public.mercadopago_contas ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS mercadopago_contas_updated_at ON public.mercadopago_contas;
CREATE TRIGGER mercadopago_contas_updated_at
  BEFORE UPDATE ON public.mercadopago_contas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();