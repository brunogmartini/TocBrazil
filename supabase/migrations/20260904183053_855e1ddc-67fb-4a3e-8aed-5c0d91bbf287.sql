CREATE TABLE public.avaliacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  nota integer NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario text,
  publica boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (appointment_id)
);

CREATE INDEX avaliacoes_prof_idx ON public.avaliacoes (professional_id);

GRANT SELECT ON public.avaliacoes TO anon;
GRANT SELECT, INSERT, UPDATE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY avaliacoes_public_select ON public.avaliacoes
  FOR SELECT TO anon, authenticated
  USING (publica = true);

CREATE POLICY avaliacoes_partes_select ON public.avaliacoes
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.owns_professional(professional_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY avaliacoes_patient_insert ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
        AND a.patient_id = auth.uid()
        AND a.professional_id = avaliacoes.professional_id
        AND a.status = 'realizada'
    )
  );

CREATE POLICY avaliacoes_update ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER avaliacoes_updated BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.avaliacoes_resumo(_professional_id uuid)
RETURNS TABLE(media numeric, total integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(nota)::numeric, 2), 0), COUNT(*)::int
  FROM public.avaliacoes
  WHERE professional_id = _professional_id AND publica = true;
$$;

REVOKE EXECUTE ON FUNCTION public.avaliacoes_resumo(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.avaliacoes_resumo(uuid) TO anon, authenticated, service_role;