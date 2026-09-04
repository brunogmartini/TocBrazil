-- ROLES
CREATE TYPE public.app_role AS ENUM ('paciente','profissional','admin');
CREATE TYPE public.profissao AS ENUM ('psicologo','psiquiatra');
CREATE TYPE public.prof_status AS ENUM ('pendente','aprovado','suspenso');
CREATE TYPE public.appointment_status AS ENUM ('aguardando_pagamento','confirmada','realizada','cancelada','remarcada','nao_compareceu');
CREATE TYPE public.payment_status AS ENUM ('pendente','aprovado','recusado','estornado','cancelado');
CREATE TYPE public.payout_status AS ENUM ('pendente','processando','pago','falhou');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nome text,
  email text,
  telefone text,
  foto_url text,
  data_nascimento date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_own_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFESSIONALS
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  profissao public.profissao NOT NULL,
  registro text NOT NULL,
  uf text NOT NULL,
  foto_url text,
  abordagem text,
  apresentacao text,
  experiencia_toc text,
  experiencia_anos int NOT NULL DEFAULT 0,
  formacao text[] NOT NULL DEFAULT '{}',
  especializacoes text[] NOT NULL DEFAULT '{}',
  areas text[] NOT NULL DEFAULT '{}',
  idiomas text[] NOT NULL DEFAULT '{}',
  genero text,
  status public.prof_status NOT NULL DEFAULT 'pendente',
  comissao_percent numeric NOT NULL DEFAULT 30,
  slot_minutos int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.professionals TO anon;
GRANT SELECT, INSERT, UPDATE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prof_public_select" ON public.professionals FOR SELECT TO anon, authenticated USING (status = 'aprovado');
CREATE POLICY "prof_own_select" ON public.professionals FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "prof_own_insert" ON public.professionals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prof_own_update" ON public.professionals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "prof_admin_all" ON public.professionals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER professionals_updated BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.owns_professional(_professional_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = _professional_id AND p.user_id = auth.uid());
$$;

-- PAYOUT DETAILS
CREATE TABLE public.professional_payout_details (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  banco text, agencia text, conta text, tipo_conta text, chave_pix text, documento text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.professional_payout_details TO authenticated;
GRANT ALL ON public.professional_payout_details TO service_role;
ALTER TABLE public.professional_payout_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_details_own" ON public.professional_payout_details FOR ALL TO authenticated
  USING (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));

-- AVAILABILITY
CREATE TABLE public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday int NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.availability_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_rules TO authenticated;
GRANT ALL ON public.availability_rules TO service_role;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules_public_select" ON public.availability_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rules_own_all" ON public.availability_rules FOR ALL TO authenticated
  USING (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.availability_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_blocks TO authenticated;
GRANT ALL ON public.availability_blocks TO service_role;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_public_select" ON public.availability_blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "blocks_own_all" ON public.availability_blocks FOR ALL TO authenticated
  USING (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'aguardando_pagamento',
  payment_status public.payment_status NOT NULL DEFAULT 'pendente',
  valor_centavos int NOT NULL DEFAULT 5000,
  valor_profissional_centavos int NOT NULL DEFAULT 0,
  valor_plataforma_centavos int NOT NULL DEFAULT 0,
  primeira_consulta boolean NOT NULL DEFAULT true,
  observacoes text,
  video_url text,
  cancelada_em timestamptz,
  cancelada_por text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX appointments_slot_unico ON public.appointments (professional_id, inicio)
  WHERE status IN ('aguardando_pagamento','confirmada','realizada');
CREATE INDEX appointments_patient_idx ON public.appointments (patient_id, inicio DESC);
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_patient_select" ON public.appointments FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "appt_patient_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());
CREATE POLICY "appt_update" ON public.appointments FOR UPDATE TO authenticated
  USING (patient_id = auth.uid() OR public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (patient_id = auth.uid() OR public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- busy slots visible publicly (times only, no PII)
CREATE OR REPLACE FUNCTION public.horarios_ocupados(_professional_id uuid, _de timestamptz, _ate timestamptz)
RETURNS TABLE (inicio timestamptz, fim timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.inicio, a.fim FROM public.appointments a
  WHERE a.professional_id = _professional_id
    AND a.status IN ('aguardando_pagamento','confirmada','realizada')
    AND a.inicio >= _de AND a.inicio < _ate;
$$;
GRANT EXECUTE ON FUNCTION public.horarios_ocupados(uuid, timestamptz, timestamptz) TO anon, authenticated;

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'pendente_configuracao',
  provider_ref text,
  metodo text NOT NULL DEFAULT 'cartao_credito',
  status public.payment_status NOT NULL DEFAULT 'pendente',
  valor_centavos int NOT NULL,
  valor_profissional_centavos int NOT NULL DEFAULT 0,
  valor_plataforma_centavos int NOT NULL DEFAULT 0,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYOUTS
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  valor_centavos int NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pendente',
  previsto_para date,
  pago_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_select" ON public.payouts FOR SELECT TO authenticated
  USING (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  canal text NOT NULL DEFAULT 'email',
  titulo text NOT NULL,
  corpo text NOT NULL,
  agendada_para timestamptz NOT NULL DEFAULT now(),
  enviada_em timestamptz,
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SETTINGS
CREATE TABLE public.platform_settings (
  chave text PRIMARY KEY,
  valor jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_select" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_all" ON public.platform_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.platform_settings (chave, valor) VALUES
  ('taxa_confirmacao_centavos', '5000'::jsonb),
  ('comissao_plataforma_percent', '30'::jsonb),
  ('cancelamento_horas_minimas', '24'::jsonb);

-- DEMO PROFESSIONALS
INSERT INTO public.professionals (slug, nome, profissao, registro, uf, abordagem, apresentacao, experiencia_toc, experiencia_anos, formacao, especializacoes, areas, idiomas, genero, status)
VALUES
 ('ana-beatriz-moraes','Ana Beatriz Moraes','psicologo','CRP 06/000001 (demonstração)','SP','Terapia Cognitivo-Comportamental','Atendo adultos com TOC, com foco em exposição e prevenção de resposta.','Atendimento contínuo a pessoas com TOC, incluindo checagem, contaminação e obsessões de conteúdo agressivo.',11,ARRAY['Psicologia — USP'],ARRAY['TCC para TOC','Exposição e Prevenção de Resposta'],ARRAY['TOC','Ansiedade'],ARRAY['Português','Inglês'],'feminino','aprovado'),
 ('rafael-tavares','Rafael Tavares','psicologo','CRP 07/000002 (demonstração)','RS','Terapia Cognitivo-Comportamental','Trabalho com adolescentes e adultos, com foco em rituais mentais e evitação.','Experiência declarada com TOC de repetição, simetria e rituais mentais.',8,ARRAY['Psicologia — UFRGS'],ARRAY['TCC','ERP','Terapia de Aceitação e Compromisso'],ARRAY['TOC','TOC infantil'],ARRAY['Português'],'masculino','aprovado'),
 ('carolina-lemos','Carolina Lemos','psiquiatra','CRM 000003-SP (demonstração)','SP','Psiquiatria com foco em transtornos ansiosos','Avaliação diagnóstica e acompanhamento medicamentoso quando indicado.','Acompanhamento de TOC resistente e comorbidades como depressão e ansiedade.',14,ARRAY['Medicina — Unifesp','Residência em Psiquiatria'],ARRAY['Psicofarmacologia','TOC'],ARRAY['TOC','Depressão'],ARRAY['Português','Espanhol'],'feminino','aprovado'),
 ('marcos-vinicius-alves','Marcos Vinícius Alves','psiquiatra','CRM 000004-MG (demonstração)','MG','Psiquiatria clínica','Avaliação inicial, diagnóstico diferencial e plano de tratamento com o psicólogo.','Trabalho conjunto com psicólogos em casos de TOC de moderado a grave.',9,ARRAY['Medicina — UFMG','Residência em Psiquiatria'],ARRAY['TOC','Transtornos de ansiedade'],ARRAY['TOC','Ansiedade'],ARRAY['Português'],'masculino','aprovado');

INSERT INTO public.availability_rules (professional_id, weekday, hora_inicio, hora_fim)
SELECT p.id, d.weekday, '09:00'::time, '17:00'::time
FROM public.professionals p CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(weekday);