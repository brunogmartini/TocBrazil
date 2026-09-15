CREATE TABLE public.contratos_profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  versao text NOT NULL,
  nome_assinatura text NOT NULL,
  documento text NOT NULL,
  aceite_ip text,
  user_agent text,
  aceito_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, versao)
);

GRANT SELECT, INSERT ON public.contratos_profissionais TO authenticated;
GRANT ALL ON public.contratos_profissionais TO service_role;

ALTER TABLE public.contratos_profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof le seu contrato" ON public.contratos_profissionais
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "prof assina seu contrato" ON public.contratos_profissionais
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
);

CREATE TRIGGER set_contratos_profissionais_updated_at
BEFORE UPDATE ON public.contratos_profissionais
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();