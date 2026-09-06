-- 1. Esquema privado para funções internas
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, app_role) SET SCHEMA private;
ALTER FUNCTION public.owns_professional(uuid) SET SCHEMA private;
ALTER FUNCTION public.horarios_ocupados(uuid, timestamptz, timestamptz) SET SCHEMA private;
ALTER FUNCTION public.slots_disponiveis(text, integer) SET SCHEMA private;
ALTER FUNCTION public.avaliacoes_resumo(uuid) SET SCHEMA private;

ALTER FUNCTION private.has_role(uuid, app_role) SET search_path = private, public;
ALTER FUNCTION private.owns_professional(uuid) SET search_path = private, public;
ALTER FUNCTION private.horarios_ocupados(uuid, timestamptz, timestamptz) SET search_path = private, public;
ALTER FUNCTION private.slots_disponiveis(text, integer) SET search_path = private, public;
ALTER FUNCTION private.avaliacoes_resumo(uuid) SET search_path = private, public;

REVOKE ALL ON FUNCTION private.horarios_ocupados(uuid, timestamptz, timestamptz) FROM anon, authenticated;

-- 2. Wrappers públicos (SECURITY INVOKER) para as chamadas do aplicativo
CREATE OR REPLACE FUNCTION public.slots_disponiveis(_slug text, _dias integer)
RETURNS TABLE(inicio timestamptz, fim timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public
AS $$ SELECT s.inicio, s.fim FROM private.slots_disponiveis(_slug, _dias) s $$;

CREATE OR REPLACE FUNCTION public.avaliacoes_resumo(_professional_id uuid)
RETURNS TABLE(media numeric, total integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public
AS $$ SELECT r.media, r.total FROM private.avaliacoes_resumo(_professional_id) r $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public
AS $$ SELECT private.has_role(_user_id, _role) $$;

REVOKE ALL ON FUNCTION public.slots_disponiveis(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.avaliacoes_resumo(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slots_disponiveis(text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.avaliacoes_resumo(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 3. Agenda deixa de ser legível por visitantes anônimos
DROP POLICY IF EXISTS blocks_public_select ON public.availability_blocks;
DROP POLICY IF EXISTS rules_public_select ON public.availability_rules;
REVOKE ALL ON public.availability_blocks FROM anon;
REVOKE ALL ON public.availability_rules FROM anon;

-- 4. Credenciais de pagamento acessíveis apenas pelo servidor confiável
ALTER TABLE public.mercadopago_contas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mercadopago_contas FROM anon, authenticated;
GRANT ALL ON public.mercadopago_contas TO service_role;

CREATE POLICY mp_contas_service_only ON public.mercadopago_contas
FOR ALL TO service_role USING (true) WITH CHECK (true);