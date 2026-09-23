-- Bloco A: RLS em todas as tabelas, exposicao publica minima e funcoes privilegiadas restritas.

ALTER TABLE private.cron_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.cron_token FORCE ROW LEVEL SECURITY;
REVOKE ALL ON private.cron_token FROM PUBLIC, anon, authenticated;
GRANT SELECT ON private.cron_token TO service_role;

ALTER TABLE public.appointment_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_profissionais FORCE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_auditoria FORCE ROW LEVEL SECURITY;
ALTER TABLE public.livro_compras FORCE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_contas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinical_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payouts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.professional_payout_details FORCE ROW LEVEL SECURITY;
ALTER TABLE public.professional_status_history FORCE ROW LEVEL SECURITY;
ALTER TABLE public.professionals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Visitantes nunca recebem privilegios de escrita ou leitura em tabelas privadas.
REVOKE ALL ON public.appointment_messages FROM anon;
REVOKE ALL ON public.appointment_notes FROM anon;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.availability_blocks FROM anon;
REVOKE ALL ON public.availability_rules FROM anon;
REVOKE ALL ON public.avaliacoes FROM anon;
REVOKE ALL ON public.contratos_profissionais FROM anon;
REVOKE ALL ON public.eventos_auditoria FROM anon;
REVOKE ALL ON public.livro_compras FROM anon;
REVOKE ALL ON public.mercadopago_contas FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.patient_clinical_records FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.payouts FROM anon;
REVOKE ALL ON public.platform_settings FROM anon;
REVOKE ALL ON public.professional_documents FROM anon;
REVOKE ALL ON public.professional_payout_details FROM anon;
REVOKE ALL ON public.professional_status_history FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- O perfil publico expoe somente campos usados na busca e pagina publica.
REVOKE ALL ON public.professionals FROM anon;
GRANT SELECT (
  id, slug, nome, profissao, registro, uf, foto_url, abordagem, apresentacao,
  experiencia_toc, experiencia_anos, formacao, especializacoes, areas, idiomas,
  genero, slot_minutos, valor_centavos, cidade, graduacao, instituicao, cursos
) ON public.professionals TO anon;

DROP POLICY IF EXISTS prof_public_select ON public.professionals;
CREATE POLICY prof_public_select
  ON public.professionals
  FOR SELECT
  TO anon, authenticated
  USING (status = 'aprovado');

-- Avaliacoes publicas respeitam RLS do chamador e nunca carregam identificadores do paciente.
DROP POLICY IF EXISTS avaliacoes_public_view_select ON public.avaliacoes;
CREATE POLICY avaliacoes_public_view_select
  ON public.avaliacoes
  FOR SELECT
  TO anon
  USING (publica = true AND moderacao = 'publicada');
GRANT SELECT (id, professional_id, nota, comentario, created_at) ON public.avaliacoes TO anon;
ALTER VIEW public.avaliacoes_publicas SET (security_invoker = true, security_barrier = true);
REVOKE ALL ON public.avaliacoes_publicas FROM PUBLIC;
GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;

-- Nome minimo dos pacientes vinculados, sem telefone, e-mail, nascimento ou contato de emergencia.
CREATE OR REPLACE FUNCTION public.meus_pacientes_agendados()
RETURNS TABLE(id uuid, nome text, codigo_anonimo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
  SELECT DISTINCT pr.id, pr.nome, pr.codigo_anonimo
  FROM public.profiles pr
  JOIN public.appointments a ON a.patient_id = pr.id
  JOIN public.professionals p ON p.id = a.professional_id
  WHERE p.user_id = auth.uid();
$function$;
REVOKE ALL ON FUNCTION public.meus_pacientes_agendados() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.meus_pacientes_agendados() TO authenticated, service_role;

-- Contato de emergencia: somente o proprio paciente, admin ou psicologo com consulta confirmada/realizada.
CREATE OR REPLACE FUNCTION public.contato_emergencia_paciente(_patient_id uuid)
RETURNS TABLE(nome text, telefone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
  SELECT pr.contato_emergencia_nome, pr.contato_emergencia_telefone
  FROM public.profiles pr
  WHERE pr.id = _patient_id
    AND (
      pr.id = auth.uid()
      OR private.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.appointments a
        JOIN public.professionals p ON p.id = a.professional_id
        WHERE a.patient_id = pr.id
          AND p.user_id = auth.uid()
          AND a.status IN ('confirmada', 'realizada')
      )
    );
$function$;
REVOKE ALL ON FUNCTION public.contato_emergencia_paciente(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contato_emergencia_paciente(uuid) TO authenticated, service_role;

-- Verificacao de papel publica somente responde sobre a propria identidade autenticada.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'private', 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE private.has_role(_user_id, _role)
  END;
$function$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Funcoes privadas so podem ser executadas pelos papeis estritamente necessarios.
REVOKE ALL ON FUNCTION private.atende_paciente(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.vinculado_ao_paciente(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_professional(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.horarios_ocupados(uuid, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.slots_disponiveis(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.proximos_horarios(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.avaliacoes_resumo(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.atende_paciente(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.vinculado_ao_paciente(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_professional(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.horarios_ocupados(uuid, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION private.slots_disponiveis(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION private.proximos_horarios(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION private.avaliacoes_resumo(uuid) TO service_role;

-- Funcoes publicas privilegiadas: nenhuma permissao implicita para PUBLIC.
REVOKE ALL ON FUNCTION public.appointments_guard_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.appointments_on_realizada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.concluir_consultas_vencidas() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cron_token_valido(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.documents_guard_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expirar_reservas_vencidas() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.livro_guard_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.professionals_guard_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.professionals_log_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.relatorio_metadados(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.appointments_guard_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.appointments_on_realizada() TO service_role;
GRANT EXECUTE ON FUNCTION public.concluir_consultas_vencidas() TO service_role;
GRANT EXECUTE ON FUNCTION public.cron_token_valido(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.documents_guard_admin_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.expirar_reservas_vencidas() TO service_role;
GRANT EXECUTE ON FUNCTION public.livro_guard_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.professionals_guard_admin_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.professionals_log_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.relatorio_metadados(timestamptz, timestamptz) TO service_role;