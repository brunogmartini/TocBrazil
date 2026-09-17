-- A plataforma é de tecnologia e não guarda dados de saúde: nenhum cliente
-- (paciente, profissional ou gestor) pode mais ler ou gravar ficha clínica
-- e anotações de consulta.
DROP POLICY IF EXISTS "ficha_profissional" ON public.patient_clinical_records;
DROP POLICY IF EXISTS "anotacoes_profissional" ON public.appointment_notes;

REVOKE ALL ON public.patient_clinical_records FROM anon, authenticated;
REVOKE ALL ON public.appointment_notes FROM anon, authenticated;

ALTER TABLE public.patient_clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;

-- Taxa fixa por consulta realizada é o único custo do profissional.
UPDATE public.platform_settings SET valor = to_jsonb(0) WHERE chave = 'comissao_plataforma_percent';
