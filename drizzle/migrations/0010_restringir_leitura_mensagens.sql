DROP POLICY IF EXISTS "partes marcam mensagens como lidas" ON public.appointment_messages;

CREATE POLICY "partes marcam mensagens como lidas"
ON public.appointment_messages
FOR UPDATE
TO authenticated
USING (
  autor_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.appointments a
    LEFT JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id = appointment_messages.appointment_id
      AND (a.patient_id = auth.uid() OR p.user_id = auth.uid())
  )
)
WITH CHECK (
  autor_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.appointments a
    LEFT JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id = appointment_messages.appointment_id
      AND (a.patient_id = auth.uid() OR p.user_id = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.appointment_messages_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.appointment_id IS DISTINCT FROM OLD.appointment_id
     OR NEW.autor_id IS DISTINCT FROM OLD.autor_id
     OR NEW.autor_papel IS DISTINCT FROM OLD.autor_papel
     OR NEW.corpo IS DISTINCT FROM OLD.corpo
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Somente o status de leitura pode ser atualizado';
  END IF;

  NEW.lida_em := COALESCE(OLD.lida_em, now());
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.appointment_messages_guard_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.appointment_messages_guard_update() TO service_role;

DROP TRIGGER IF EXISTS appointment_messages_guard_update ON public.appointment_messages;
CREATE TRIGGER appointment_messages_guard_update
BEFORE UPDATE ON public.appointment_messages
FOR EACH ROW
EXECUTE FUNCTION public.appointment_messages_guard_update();