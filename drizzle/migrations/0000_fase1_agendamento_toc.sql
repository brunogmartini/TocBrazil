-- Fase 1: dados do profissional (verificacao documental, ferramenta de video), taxa fixa,
-- contato de emergencia administrativo, auditoria de metadados e avaliacoes administrativas.

-- 1. Novos valores de enum
ALTER TYPE public.prof_status ADD VALUE IF NOT EXISTS 'descredenciado';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'expirado';

-- 2. Profissionais: ferramenta de comunicacao propria + verificacao documental
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS rqe TEXT,
  ADD COLUMN IF NOT EXISTS ferramenta_provedor TEXT,
  ADD COLUMN IF NOT EXISTS ferramenta_url_sala TEXT,
  ADD COLUMN IF NOT EXISTS ferramenta_instrucoes TEXT,
  ADD COLUMN IF NOT EXISTS certidao_conselho_url TEXT,
  ADD COLUMN IF NOT EXISTS certidao_validade DATE,
  ADD COLUMN IF NOT EXISTS apolice_seguro_url TEXT,
  ADD COLUMN IF NOT EXISTS apolice_validade DATE,
  ADD COLUMN IF NOT EXISTS documentos_formacao_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verificado_em_doc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- 3. Pacientes: contato de emergencia (dado administrativo) e localidade
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contato_emergencia_nome TEXT,
  ADD COLUMN IF NOT EXISTS contato_emergencia_telefone TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS uf TEXT;

-- 4. Agendamentos: taxa fixa da plataforma, link snapshot, confirmacao de realizacao
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS taxa_plataforma_centavos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_acesso TEXT,
  ADD COLUMN IF NOT EXISTS confirmado_realizado_por TEXT,
  ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reserva_expira_em TIMESTAMPTZ;

-- 5. Avaliacoes administrativas + moderacao
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS pontualidade INTEGER,
  ADD COLUMN IF NOT EXISTS clareza INTEGER,
  ADD COLUMN IF NOT EXISTS cordialidade INTEGER,
  ADD COLUMN IF NOT EXISTS moderacao TEXT NOT NULL DEFAULT 'pendente_moderacao';

CREATE OR REPLACE FUNCTION public.avaliacoes_valida_notas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.pontualidade IS NOT NULL AND (NEW.pontualidade < 1 OR NEW.pontualidade > 5) THEN
    RAISE EXCEPTION 'pontualidade deve estar entre 1 e 5';
  END IF;
  IF NEW.clareza IS NOT NULL AND (NEW.clareza < 1 OR NEW.clareza > 5) THEN
    RAISE EXCEPTION 'clareza deve estar entre 1 e 5';
  END IF;
  IF NEW.cordialidade IS NOT NULL AND (NEW.cordialidade < 1 OR NEW.cordialidade > 5) THEN
    RAISE EXCEPTION 'cordialidade deve estar entre 1 e 5';
  END IF;
  IF NEW.moderacao NOT IN ('pendente_moderacao', 'publicada', 'rejeitada') THEN
    RAISE EXCEPTION 'moderacao invalida';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS avaliacoes_valida ON public.avaliacoes;
CREATE TRIGGER avaliacoes_valida
  BEFORE INSERT OR UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.avaliacoes_valida_notas();

-- 6. Auditoria de metadados (nunca conteudo de atendimento)
CREATE TABLE IF NOT EXISTS public.eventos_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  ator UUID,
  ator_papel TEXT,
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.eventos_auditoria TO authenticated;
GRANT ALL ON public.eventos_auditoria TO service_role;
ALTER TABLE public.eventos_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria admin le tudo" ON public.eventos_auditoria;
CREATE POLICY "auditoria admin le tudo"
  ON public.eventos_auditoria FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS eventos_auditoria_appointment_idx ON public.eventos_auditoria (appointment_id);
CREATE INDEX IF NOT EXISTS eventos_auditoria_ocorrido_idx ON public.eventos_auditoria (ocorrido_em DESC);

-- 7. Indices para busca por disponibilidade
CREATE INDEX IF NOT EXISTS appointments_professional_inicio_idx ON public.appointments (professional_id, inicio);
CREATE INDEX IF NOT EXISTS availability_rules_prof_idx ON public.availability_rules (professional_id, weekday);
CREATE INDEX IF NOT EXISTS availability_blocks_prof_idx ON public.availability_blocks (professional_id, inicio, fim);