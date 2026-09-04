CREATE TYPE public.doc_status AS ENUM ('enviado','aprovado','recusado');

CREATE TABLE public.professional_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  nome_arquivo text NOT NULL,
  caminho text NOT NULL,
  status doc_status NOT NULL DEFAULT 'enviado',
  observacao_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_documents TO authenticated;
GRANT ALL ON public.professional_documents TO service_role;

ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_own_all" ON public.professional_documents FOR ALL TO authenticated
  USING (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_professional(professional_id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER documents_updated BEFORE UPDATE ON public.professional_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.professionals
  ADD COLUMN valor_centavos integer NOT NULL DEFAULT 5000,
  ADD COLUMN cidade text,
  ADD COLUMN telefone text,
  ADD COLUMN email_contato text,
  ADD COLUMN destaque text;