CREATE TABLE public.appointment_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  frequencia text NOT NULL,
  faixa_horario time NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointment_series_frequencia CHECK (frequencia IN ('semanal','quinzenal'))
);
GRANT SELECT, INSERT, UPDATE ON public.appointment_series TO authenticated;
GRANT ALL ON public.appointment_series TO service_role;
ALTER TABLE public.appointment_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_series FORCE ROW LEVEL SECURITY;
CREATE POLICY series_patient_all ON public.appointment_series FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY series_prof_select ON public.appointment_series FOR SELECT TO authenticated USING (private.owns_professional(professional_id));

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.appointment_series(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS remarcada_de uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE TABLE public.continuity_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL,
  manifestacao_em date NOT NULL,
  iniciativa_paciente boolean NOT NULL,
  valor_centavos integer NOT NULL,
  status text NOT NULL DEFAULT 'aguardando_pagamento',
  provider_ref text,
  pago_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT continuity_valor_positivo CHECK (valor_centavos > 0),
  CONSTRAINT continuity_status CHECK (status IN ('aguardando_pagamento','pago','cancelado')),
  CONSTRAINT continuity_iniciativa CHECK (iniciativa_paciente = true)
);
GRANT SELECT, INSERT ON public.continuity_requests TO authenticated;
GRANT ALL ON public.continuity_requests TO service_role;
ALTER TABLE public.continuity_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY continuity_prof_insert ON public.continuity_requests FOR INSERT TO authenticated WITH CHECK (private.owns_professional(professional_id));
CREATE POLICY continuity_parties_select ON public.continuity_requests FOR SELECT TO authenticated USING (patient_id = auth.uid() OR private.owns_professional(professional_id));

CREATE TABLE public.post_consultation_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  resposta text NOT NULL,
  responded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT survey_resposta CHECK (resposta IN ('sim','ainda_nao_sei','nao'))
);
GRANT SELECT, INSERT, UPDATE ON public.post_consultation_surveys TO authenticated;
GRANT ALL ON public.post_consultation_surveys TO service_role;
ALTER TABLE public.post_consultation_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_consultation_surveys FORCE ROW LEVEL SECURITY;
CREATE POLICY survey_patient_all ON public.post_consultation_surveys FOR ALL TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

CREATE INDEX appointment_series_patient_idx ON public.appointment_series(patient_id, created_at DESC);
CREATE INDEX continuity_professional_idx ON public.continuity_requests(professional_id, created_at DESC);
CREATE INDEX surveys_professional_idx ON public.post_consultation_surveys(professional_id, responded_at DESC);

CREATE OR REPLACE FUNCTION public.indicadores_profissionais()
RETURNS TABLE(
  professional_id uuid, nome text, pacientes_primeira_consulta integer,
  pacientes_retorno integer, taxa_retorno numeric, cancelamentos_tardios integer,
  nao_comparecimentos integer, deteccoes integer, continuidades integer,
  alerta_cancelamento boolean, alerta_retorno boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'private','public'
AS $function$
WITH base AS (
  SELECT p.id, p.nome,
    count(DISTINCT a.patient_id) FILTER (WHERE a.primeira_consulta AND a.status='realizada')::int AS primeiras,
    count(DISTINCT a.patient_id) FILTER (WHERE NOT a.primeira_consulta AND a.status='realizada')::int AS retornos,
    count(*) FILTER (WHERE a.status='nao_compareceu' AND a.cancelada_por='paciente')::int AS tardios,
    count(*) FILTER (WHERE a.status='nao_compareceu')::int AS faltas
  FROM public.professionals p LEFT JOIN public.appointments a ON a.professional_id=p.id GROUP BY p.id,p.nome
), calc AS (
 SELECT *, CASE WHEN primeiras=0 THEN 0 ELSE retornos::numeric/primeiras END taxa,
 avg(tardios) OVER() media_c, stddev_pop(tardios) OVER() dp_c,
 avg(CASE WHEN primeiras=0 THEN 0 ELSE retornos::numeric/primeiras END) OVER() media_r,
 stddev_pop(CASE WHEN primeiras=0 THEN 0 ELSE retornos::numeric/primeiras END) OVER() dp_r
 FROM base
)
SELECT c.id,c.nome,c.primeiras,c.retornos,round(c.taxa,3),c.tardios,c.faltas,
 (SELECT count(*)::int FROM public.deteccoes_anticontato d WHERE d.professional_id=c.id),
 (SELECT count(*)::int FROM public.continuity_requests x WHERE x.professional_id=c.id),
 c.tardios > c.media_c + 2*coalesce(c.dp_c,0), c.taxa < c.media_r - 2*coalesce(c.dp_r,0)
FROM calc c ORDER BY c.nome;
$function$;
REVOKE ALL ON FUNCTION public.indicadores_profissionais() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.indicadores_profissionais() TO service_role;