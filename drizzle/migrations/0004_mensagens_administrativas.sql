CREATE TABLE public.appointment_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL,
  autor_papel text NOT NULL CHECK (autor_papel IN ('paciente','profissional')),
  corpo text NOT NULL CHECK (length(btrim(corpo)) BETWEEN 1 AND 1000),
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointment_messages_appointment_idx
  ON public.appointment_messages (appointment_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.appointment_messages TO authenticated;
GRANT ALL ON public.appointment_messages TO service_role;

ALTER TABLE public.appointment_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partes leem mensagens da consulta"
ON public.appointment_messages FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    LEFT JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id = appointment_messages.appointment_id
      AND (a.patient_id = auth.uid() OR p.user_id = auth.uid())
  )
);

CREATE POLICY "partes escrevem mensagens da consulta"
ON public.appointment_messages FOR INSERT
TO authenticated
WITH CHECK (
  autor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    LEFT JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id = appointment_messages.appointment_id
      AND (
        (a.patient_id = auth.uid() AND autor_papel = 'paciente')
        OR (p.user_id = auth.uid() AND autor_papel = 'profissional')
      )
  )
);

CREATE POLICY "partes marcam mensagens como lidas"
ON public.appointment_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    LEFT JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id = appointment_messages.appointment_id
      AND (a.patient_id = auth.uid() OR p.user_id = auth.uid())
  )
)
WITH CHECK (true);