ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS abordagens_publicas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS formacoes_publicas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS temas_toc_publicos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS biografia_publica text,
  ADD COLUMN IF NOT EXISTS foto_caminho text,
  ADD COLUMN IF NOT EXISTS foto_status text NOT NULL DEFAULT 'nao_enviada',
  ADD COLUMN IF NOT EXISTS foto_moderada_em timestamptz,
  ADD COLUMN IF NOT EXISTS foto_moderada_por uuid,
  ADD COLUMN IF NOT EXISTS foto_observacao text,
  ADD COLUMN IF NOT EXISTS perfil_bloqueios_contato integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.professionals.cidade IS 'DEPRECATED: nao integra o perfil publico nem o cadastro profissional atual';
COMMENT ON COLUMN public.professionals.telefone IS 'DEPRECATED: nao integra o perfil publico nem o cadastro profissional atual';
COMMENT ON COLUMN public.professionals.email_contato IS 'DEPRECATED: nao integra o perfil publico nem o cadastro profissional atual';
COMMENT ON COLUMN public.professionals.abordagem IS 'DEPRECATED: substituida por abordagens_publicas';
COMMENT ON COLUMN public.professionals.apresentacao IS 'DEPRECATED: substituida por biografia_publica';
COMMENT ON COLUMN public.professionals.experiencia_toc IS 'DEPRECATED: substituida por temas_toc_publicos';
COMMENT ON COLUMN public.professionals.formacao IS 'DEPRECATED: substituida por formacoes_publicas';

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_abordagens_publicas_max3 CHECK (cardinality(abordagens_publicas) <= 3) NOT VALID,
  ADD CONSTRAINT professionals_biografia_publica_limite CHECK (biografia_publica IS NULL OR char_length(biografia_publica) <= 600) NOT VALID,
  ADD CONSTRAINT professionals_foto_status_valido CHECK (foto_status IN ('nao_enviada','pendente','aprovada','recusada')) NOT VALID,
  ADD CONSTRAINT professionals_formacoes_publicas_array CHECK (jsonb_typeof(formacoes_publicas) = 'array') NOT VALID;

CREATE INDEX IF NOT EXISTS professionals_fila_anticontato_idx
  ON public.professionals (perfil_bloqueios_contato DESC)
  WHERE perfil_bloqueios_contato > 2;
CREATE INDEX IF NOT EXISTS professionals_foto_pendente_idx
  ON public.professionals (foto_status)
  WHERE foto_status = 'pendente';

CREATE TABLE public.deteccoes_anticontato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  ator_id uuid NOT NULL,
  contexto text NOT NULL,
  padrao_tipo text NOT NULL,
  acao text NOT NULL,
  ocorrido_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deteccoes_contexto_valido CHECK (contexto IN ('perfil','chat')),
  CONSTRAINT deteccoes_acao_valida CHECK (acao IN ('bloqueado','advertido')),
  CONSTRAINT deteccoes_identificador CHECK (professional_id IS NOT NULL OR appointment_id IS NOT NULL)
);
GRANT SELECT ON public.deteccoes_anticontato TO authenticated;
GRANT ALL ON public.deteccoes_anticontato TO service_role;
ALTER TABLE public.deteccoes_anticontato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deteccoes_anticontato FORCE ROW LEVEL SECURITY;
CREATE POLICY deteccoes_admin_select
  ON public.deteccoes_anticontato FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));
CREATE INDEX deteccoes_anticontato_professional_idx ON public.deteccoes_anticontato (professional_id, ocorrido_em DESC);
CREATE INDEX deteccoes_anticontato_appointment_idx ON public.deteccoes_anticontato (appointment_id, ocorrido_em DESC);

CREATE OR REPLACE FUNCTION public.registrar_deteccao_anticontato(
  _professional_id uuid,
  _appointment_id uuid,
  _contexto text,
  _padrao_tipo text,
  _acao text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;
  IF _contexto NOT IN ('perfil','chat') OR _acao NOT IN ('bloqueado','advertido') THEN
    RAISE EXCEPTION 'Metadados invalidos';
  END IF;
  IF _contexto = 'perfil' THEN
    IF _professional_id IS NULL OR NOT private.owns_professional(_professional_id) THEN
      RAISE EXCEPTION 'Acesso negado';
    END IF;
  ELSE
    IF _appointment_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.appointments a
      LEFT JOIN public.professionals p ON p.id = a.professional_id
      WHERE a.id = _appointment_id AND (a.patient_id = auth.uid() OR p.user_id = auth.uid())
    ) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  END IF;
  INSERT INTO public.deteccoes_anticontato
    (professional_id, appointment_id, ator_id, contexto, padrao_tipo, acao)
  VALUES (_professional_id, _appointment_id, auth.uid(), _contexto, left(_padrao_tipo, 40), _acao);
  IF _contexto = 'perfil' AND _acao = 'bloqueado' THEN
    UPDATE public.professionals
      SET perfil_bloqueios_contato = perfil_bloqueios_contato + 1
      WHERE id = _professional_id;
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.registrar_deteccao_anticontato(uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_deteccao_anticontato(uuid, uuid, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.professionals_guard_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') OR private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.telefone := NULL;
    NEW.email_contato := NULL;
    NEW.cidade := NULL;
    NEW.foto_status := CASE WHEN NEW.foto_caminho IS NULL THEN 'nao_enviada' ELSE 'pendente' END;
    NEW.foto_moderada_em := NULL;
    NEW.foto_moderada_por := NULL;
    NEW.foto_observacao := NULL;
    RETURN NEW;
  END IF;
  NEW.telefone := OLD.telefone;
  NEW.email_contato := OLD.email_contato;
  NEW.cidade := OLD.cidade;
  NEW.perfil_bloqueios_contato := OLD.perfil_bloqueios_contato;
  NEW.foto_moderada_em := OLD.foto_moderada_em;
  NEW.foto_moderada_por := OLD.foto_moderada_por;
  NEW.foto_observacao := OLD.foto_observacao;
  IF NEW.foto_caminho IS DISTINCT FROM OLD.foto_caminho THEN
    NEW.foto_status := 'pendente';
    NEW.foto_url := NULL;
  ELSE
    NEW.foto_status := OLD.foto_status;
    NEW.foto_url := OLD.foto_url;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.professionals_guard_profile_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.professionals_guard_profile_fields() TO service_role;
DROP TRIGGER IF EXISTS professionals_guard_profile_fields ON public.professionals;
CREATE TRIGGER professionals_guard_profile_fields
BEFORE INSERT OR UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.professionals_guard_profile_fields();

CREATE POLICY fotos_profissionais_insert_own ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fotos-profissionais' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY fotos_profissionais_select_own ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'fotos-profissionais' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY fotos_profissionais_update_own ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'fotos-profissionais' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'fotos-profissionais' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY fotos_profissionais_delete_own ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'fotos-profissionais' AND (storage.foldername(name))[1] = auth.uid()::text);