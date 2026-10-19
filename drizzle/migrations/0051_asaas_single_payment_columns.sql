-- Opção 1 (captura única via página segura do Asaas): a consulta tem UMA cobrança
-- de R$200 capturada no agendamento; o dinheiro fica na plataforma e o profissional
-- é pago por transferência após a consulta. O modelo A/B de pré-autorização não é
-- usado neste fluxo, então registramos a cobrança única diretamente no appointment.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS asaas_invoice_url text,
  ADD COLUMN IF NOT EXISTS asaas_payment_method text,
  -- Transferência da parte do profissional, criada na liquidação pós-consulta.
  ADD COLUMN IF NOT EXISTS professional_transfer_id text,
  ADD COLUMN IF NOT EXISTS professional_transfer_status text;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_asaas_payment_method_check CHECK (
    asaas_payment_method IS NULL OR asaas_payment_method IN ('PIX','CREDIT_CARD','UNDEFINED')
  ) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_asaas_payment_id_unique
  ON public.appointments (asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
