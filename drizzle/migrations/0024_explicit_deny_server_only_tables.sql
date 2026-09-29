CREATE POLICY asaas_customers_deny_client_access
ON public.asaas_customers
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY asaas_payment_authorizations_deny_client_access
ON public.asaas_payment_authorizations
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY asaas_professional_accounts_deny_client_access
ON public.asaas_professional_accounts
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY asaas_sandbox_test_runs_deny_client_access
ON public.asaas_sandbox_test_runs
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY asaas_webhook_events_deny_client_access
ON public.asaas_webhook_events
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY tentativas_login_gestor_deny_client_access
ON public.tentativas_login_gestor
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY cron_token_deny_client_access
ON private.cron_token
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

COMMENT ON POLICY asaas_customers_deny_client_access ON public.asaas_customers IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';
COMMENT ON POLICY asaas_payment_authorizations_deny_client_access ON public.asaas_payment_authorizations IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';
COMMENT ON POLICY asaas_professional_accounts_deny_client_access ON public.asaas_professional_accounts IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';
COMMENT ON POLICY asaas_sandbox_test_runs_deny_client_access ON public.asaas_sandbox_test_runs IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';
COMMENT ON POLICY asaas_webhook_events_deny_client_access ON public.asaas_webhook_events IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';
COMMENT ON POLICY tentativas_login_gestor_deny_client_access ON public.tentativas_login_gestor IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';
COMMENT ON POLICY cron_token_deny_client_access ON private.cron_token IS 'Acesso exclusivo do servidor; clientes anonimos e autenticados sao bloqueados explicitamente.';