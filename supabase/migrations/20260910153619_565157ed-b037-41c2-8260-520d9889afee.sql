-- ===== Consultas: modelo financeiro =====
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS taxa_agendamento_centavos integer NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS valor_consulta_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comissao_percent numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS duracao_minutos integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS realizada_em timestamptz,
  ADD COLUMN IF NOT EXISTS video_provider text NOT NULL DEFAULT 'jitsi';

UPDATE public.appointments a
SET valor_consulta_centavos = p.valor_centavos,
    comissao_percent = 25,
    valor_plataforma_centavos = round(p.valor_centavos * 0.25),
    valor_profissional_centavos = p.valor_centavos - round(p.valor_centavos * 0.25),
    duracao_minutos = GREATEST(1, (EXTRACT(EPOCH FROM (a.fim - a.inicio)) / 60))::int
FROM public.professionals p
WHERE p.id = a.professional_id;

-- ===== Profissionais =====
ALTER TABLE public.professionals ALTER COLUMN comissao_percent SET DEFAULT 25;
UPDATE public.professionals SET comissao_percent = 25 WHERE comissao_percent = 30;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS requer_correcao boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.professionals_guard_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.observacao_admin := OLD.observacao_admin;
  NEW.validado_em := OLD.validado_em;
  NEW.validado_por := OLD.validado_por;
  NEW.comissao_percent := OLD.comissao_percent;
  NEW.requer_correcao := OLD.requer_correcao;
  RETURN NEW;
END;
$function$;

CREATE TABLE public.professional_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  requer_correcao boolean NOT NULL DEFAULT false,
  observacao text,
  alterado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.professional_status_history TO authenticated;
GRANT ALL ON public.professional_status_history TO service_role;
ALTER TABLE public.professional_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY status_history_select ON public.professional_status_history
  FOR SELECT TO authenticated
  USING (private.owns_professional(professional_id) OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.professionals_log_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.professional_status_history (professional_id, status_anterior, status_novo, requer_correcao, observacao, alterado_por)
    VALUES (NEW.id, NULL, NEW.status::text, NEW.requer_correcao, 'Cadastro iniciado', auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status OR NEW.requer_correcao IS DISTINCT FROM OLD.requer_correcao THEN
    INSERT INTO public.professional_status_history (professional_id, status_anterior, status_novo, requer_correcao, observacao, alterado_por)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, NEW.requer_correcao, NEW.observacao_admin, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER professionals_log_status_ins AFTER INSERT ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.professionals_log_status();
CREATE TRIGGER professionals_log_status_upd AFTER UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.professionals_log_status();

-- ===== Pacientes: código anonimizado =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS codigo_anonimo text;
UPDATE public.profiles SET codigo_anonimo = 'P-' || upper(substr(md5(id::text), 1, 6)) WHERE codigo_anonimo IS NULL;
ALTER TABLE public.profiles ALTER COLUMN codigo_anonimo SET DEFAULT ('P-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)));

-- ===== Vínculo profissional ↔ paciente =====
CREATE OR REPLACE FUNCTION private.vinculado_ao_paciente(_professional_id uuid, _patient_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.professional_id = _professional_id
      AND a.patient_id = _patient_id
      AND a.status IN ('confirmada', 'realizada', 'nao_compareceu', 'remarcada')
  );
$function$;

CREATE OR REPLACE FUNCTION private.atende_paciente(_patient_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE p.user_id = auth.uid()
      AND a.patient_id = _patient_id
      AND a.status IN ('confirmada', 'realizada', 'nao_compareceu', 'remarcada')
  );
$function$;

CREATE POLICY profiles_professional_vinculado ON public.profiles
  FOR SELECT TO authenticated
  USING (private.atende_paciente(id));

-- ===== Ficha clínica sigilosa =====
CREATE TABLE public.patient_clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  informacoes_relevantes text,
  diagnostico text,
  historico text,
  observacoes text,
  evolucao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, professional_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_clinical_records TO authenticated;
GRANT ALL ON public.patient_clinical_records TO service_role;
ALTER TABLE public.patient_clinical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY ficha_profissional_vinculado ON public.patient_clinical_records
  FOR ALL TO authenticated
  USING (private.owns_professional(professional_id) AND private.vinculado_ao_paciente(professional_id, patient_id))
  WITH CHECK (private.owns_professional(professional_id) AND private.vinculado_ao_paciente(professional_id, patient_id));
CREATE TRIGGER ficha_updated BEFORE UPDATE ON public.patient_clinical_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.appointment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_notes TO authenticated;
GRANT ALL ON public.appointment_notes TO service_role;
ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY anotacoes_profissional_vinculado ON public.appointment_notes
  FOR ALL TO authenticated
  USING (private.owns_professional(professional_id) AND private.vinculado_ao_paciente(professional_id, patient_id))
  WITH CHECK (private.owns_professional(professional_id) AND private.vinculado_ao_paciente(professional_id, patient_id));
CREATE TRIGGER anotacoes_updated BEFORE UPDATE ON public.appointment_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Repasses =====
ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS valor_bruto_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_plataforma_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comissao_percent numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS observacao text,
  ADD COLUMN IF NOT EXISTS pago_por uuid;
CREATE UNIQUE INDEX IF NOT EXISTS payouts_appointment_unico ON public.payouts (appointment_id) WHERE appointment_id IS NOT NULL;
DELETE FROM public.payouts WHERE appointment_id IS NULL AND status = 'pendente';

-- ===== Guarda de campos da consulta =====
CREATE OR REPLACE FUNCTION public.appointments_guard_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.payment_status := OLD.payment_status;
  NEW.valor_centavos := OLD.valor_centavos;
  NEW.taxa_agendamento_centavos := OLD.taxa_agendamento_centavos;
  NEW.valor_consulta_centavos := OLD.valor_consulta_centavos;
  NEW.comissao_percent := OLD.comissao_percent;
  NEW.valor_plataforma_centavos := OLD.valor_plataforma_centavos;
  NEW.valor_profissional_centavos := OLD.valor_profissional_centavos;
  NEW.patient_id := OLD.patient_id;
  NEW.professional_id := OLD.professional_id;
  NEW.video_url := OLD.video_url;
  NEW.video_provider := OLD.video_provider;
  NEW.realizada_em := OLD.realizada_em;
  NEW.inicio := OLD.inicio;
  NEW.fim := OLD.fim;
  NEW.duracao_minutos := OLD.duracao_minutos;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF private.owns_professional(OLD.professional_id) THEN
      IF NEW.status NOT IN ('realizada', 'nao_compareceu', 'cancelada', 'confirmada') OR OLD.status = 'aguardando_pagamento' AND NEW.status IN ('realizada','confirmada') THEN
        NEW.status := OLD.status;
      END IF;
    ELSIF OLD.patient_id = auth.uid() THEN
      IF NEW.status <> 'cancelada' THEN
        NEW.status := OLD.status;
      END IF;
    ELSE
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER appointments_guard BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_guard_fields();

-- ===== Consulta realizada → financeiro =====
CREATE OR REPLACE FUNCTION public.appointments_on_realizada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF NEW.status = 'realizada' AND OLD.status IS DISTINCT FROM 'realizada' THEN
    NEW.realizada_em := COALESCE(NEW.realizada_em, now());
    NEW.valor_plataforma_centavos := round(NEW.valor_consulta_centavos * NEW.comissao_percent / 100);
    NEW.valor_profissional_centavos := NEW.valor_consulta_centavos - NEW.valor_plataforma_centavos;
    INSERT INTO public.payouts (professional_id, appointment_id, valor_centavos, valor_bruto_centavos, valor_plataforma_centavos, comissao_percent, status, previsto_para)
    VALUES (NEW.professional_id, NEW.id, NEW.valor_profissional_centavos, NEW.valor_consulta_centavos, NEW.valor_plataforma_centavos, NEW.comissao_percent, 'pendente', ((NEW.fim AT TIME ZONE 'America/Sao_Paulo')::date + 7))
    ON CONFLICT (appointment_id) WHERE appointment_id IS NOT NULL DO NOTHING;
  ELSIF OLD.status = 'realizada' AND NEW.status <> 'realizada' THEN
    DELETE FROM public.payouts WHERE appointment_id = NEW.id AND status = 'pendente';
    NEW.realizada_em := NULL;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER appointments_realizada BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_on_realizada();

CREATE OR REPLACE FUNCTION public.concluir_consultas_vencidas()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
DECLARE n integer;
BEGIN
  UPDATE public.appointments
  SET status = 'realizada'
  WHERE status = 'confirmada' AND payment_status = 'aprovado' AND fim <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$function$;
REVOKE ALL ON FUNCTION public.concluir_consultas_vencidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.concluir_consultas_vencidas() TO service_role;

REVOKE ALL ON FUNCTION public.appointments_guard_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.appointments_on_realizada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.professionals_log_status() FROM PUBLIC, anon, authenticated;

-- ===== Livro =====
CREATE TABLE public.livro_compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  status text NOT NULL DEFAULT 'nao_comprado' CHECK (status IN ('nao_comprado', 'pendente', 'confirmada', 'cancelada')),
  origem text NOT NULL DEFAULT 'hotmart',
  hotmart_transacao text UNIQUE,
  valor_centavos integer,
  clicado_em timestamptz,
  comprado_em timestamptz,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX livro_compras_user_unico ON public.livro_compras (user_id) WHERE user_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.livro_compras TO authenticated;
GRANT ALL ON public.livro_compras TO service_role;
ALTER TABLE public.livro_compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY livro_own_select ON public.livro_compras FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY livro_own_insert ON public.livro_compras FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY livro_own_update ON public.livro_compras FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER livro_compras_updated BEFORE UPDATE ON public.livro_compras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.livro_guard_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmada' THEN NEW.status := 'pendente'; END IF;
    NEW.hotmart_transacao := NULL;
    NEW.comprado_em := NULL;
    NEW.payload := NULL;
    RETURN NEW;
  END IF;
  IF OLD.status IN ('confirmada', 'cancelada') THEN NEW.status := OLD.status; ELSIF NEW.status = 'confirmada' THEN NEW.status := 'pendente'; END IF;
  NEW.hotmart_transacao := OLD.hotmart_transacao;
  NEW.comprado_em := OLD.comprado_em;
  NEW.payload := OLD.payload;
  NEW.valor_centavos := OLD.valor_centavos;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.livro_guard_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER livro_guard_ins BEFORE INSERT ON public.livro_compras FOR EACH ROW EXECUTE FUNCTION public.livro_guard_fields();
CREATE TRIGGER livro_guard_upd BEFORE UPDATE ON public.livro_compras FOR EACH ROW EXECUTE FUNCTION public.livro_guard_fields();

-- ===== Configurações =====
INSERT INTO public.platform_settings (chave, valor) VALUES
  ('comissao_plataforma_percent', '25'),
  ('taxa_confirmacao_centavos', '5000'),
  ('duracao_padrao_minutos', '50'),
  ('cancelamento_horas_minimas', '24'),
  ('remarcacao_horas_minimas', '24'),
  ('reembolso_taxa_no_prazo', 'true'),
  ('hotmart_livro_url', '""'),
  ('livro_titulo', '"Como Ser Feliz com TOC"'),
  ('livro_desconto_percent', '50'),
  ('video_provider', '"jitsi"')
ON CONFLICT (chave) DO NOTHING;
UPDATE public.platform_settings SET valor = '25', updated_at = now() WHERE chave = 'comissao_plataforma_percent';