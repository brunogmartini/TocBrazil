ALTER TABLE public.asaas_webhook_events
  ADD COLUMN IF NOT EXISTS error_message text;

COMMENT ON COLUMN public.asaas_webhook_events.error_message IS 'Mensagem operacional sanitizada, sem payload, token, dados pessoais ou financeiros.';