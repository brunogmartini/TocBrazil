ALTER TABLE public.avisos_disponibilidade FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_versoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tentativas_login_gestor FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.patient_clinical_records IS 'DEPRECATED AND LOCKED: clinical content is outside the TOC Brazil platform; no application role has access.';
COMMENT ON TABLE public.appointment_notes IS 'DEPRECATED AND LOCKED: clinical notes are outside the TOC Brazil platform; no application role has access.';
COMMENT ON COLUMN public.appointments.observacoes IS 'DEPRECATED AND LOCKED: do not store clinical or consultation content.';
REVOKE ALL ON public.patient_clinical_records FROM anon, authenticated;
REVOKE ALL ON public.appointment_notes FROM anon, authenticated;

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_actor_role_valid CHECK (actor_role IN ('paciente','profissional','admin','sistema','anonimo')),
  CONSTRAINT audit_log_action_valid CHECK (action IN ('login','logout','appointment_status_changed','credential_document_accessed','professional_registration_reviewed','profile_data_changed')),
  CONSTRAINT audit_log_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT audit_log_metadata_no_sensitive_keys CHECK (NOT metadata::text ~* 'mensagem|message|sintoma|symptom|queixa|complaint|diagnostico|diagnosis|conteudo|content|relato|observacao_clinica|evolucao')
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_log_admin_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));
CREATE INDEX audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX audit_log_entity_idx ON public.audit_log (entity, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria são imutáveis';
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_log_immutable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_immutable() TO service_role;
CREATE TRIGGER audit_log_block_mutation
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

DROP POLICY IF EXISTS docs_prof_select ON storage.objects;
CREATE POLICY docs_prof_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos-profissionais'
    AND private.has_role(auth.uid(), 'admin')
  );

REVOKE ALL ON FUNCTION public.indicadores_profissionais() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.indicadores_profissionais() TO service_role;
REVOKE ALL ON FUNCTION public.relatorio_metadados(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.relatorio_metadados(timestamptz, timestamptz) TO service_role;