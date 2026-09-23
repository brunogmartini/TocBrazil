CREATE TABLE public.avisos_disponibilidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  consentimento_em timestamptz NOT NULL DEFAULT now(),
  politica_versao text NOT NULL DEFAULT '2026-09-23',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avisos_disponibilidade_email_valido CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CONSTRAINT avisos_disponibilidade_email_unico UNIQUE (email)
);
GRANT INSERT ON public.avisos_disponibilidade TO anon, authenticated;
GRANT SELECT ON public.avisos_disponibilidade TO authenticated;
GRANT ALL ON public.avisos_disponibilidade TO service_role;
ALTER TABLE public.avisos_disponibilidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode solicitar aviso com consentimento"
ON public.avisos_disponibilidade FOR INSERT TO anon, authenticated
WITH CHECK (consentimento_em IS NOT NULL AND politica_versao <> '');
CREATE POLICY "Gestores podem consultar avisos"
ON public.avisos_disponibilidade FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.tentativas_login_gestor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificador_hash text NOT NULL,
  sucesso boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tentativas_login_gestor TO service_role;
ALTER TABLE public.tentativas_login_gestor ENABLE ROW LEVEL SECURITY;
CREATE INDEX tentativas_login_gestor_identificador_data_idx
ON public.tentativas_login_gestor (identificador_hash, created_at DESC);
COMMENT ON TABLE public.tentativas_login_gestor IS 'Controle servidor de tentativas do acesso administrativo; sem e-mail ou IP em texto aberto.';