-- Opção 1: a liquidação passa a ser enfileirada pela cobrança única
-- (appointments.asaas_payment_id), não mais só pelo modelo A/B
-- (asaas_payment_authorizations). Mantém compatibilidade com eventuais
-- autorizações legadas.
CREATE OR REPLACE FUNCTION public.enqueue_attendance_settlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target text;
BEGIN
 IF NEW.attendance_status IS NOT DISTINCT FROM OLD.attendance_status THEN RETURN NEW; END IF;
 IF NEW.attendance_status='realizada' AND ((NEW.patient_confirmed_at IS NOT NULL AND NEW.professional_confirmed_at IS NOT NULL) OR NEW.attendance_decided_at IS NOT NULL) THEN target:='REALIZADA';
 ELSIF NEW.attendance_status='falta_paciente' AND NEW.attendance_decided_at IS NOT NULL THEN target:='FALTA_PACIENTE';
 ELSIF NEW.attendance_status='falta_profissional' AND NEW.attendance_decided_at IS NOT NULL THEN target:='FALTA_PROFISSIONAL';
 ELSE RETURN NEW; END IF;
 -- Só enfileira se houver cobrança a liquidar (única da Opção 1 ou autorizações legadas).
 IF NEW.asaas_payment_id IS NULL AND NOT EXISTS(SELECT 1 FROM public.asaas_payment_authorizations WHERE appointment_id=NEW.id) THEN RETURN NEW; END IF;
 INSERT INTO public.appointment_settlement_jobs(appointment_id,outcome,available_at) VALUES(NEW.id,target,greatest(now(),NEW.fim)) ON CONFLICT(appointment_id) DO NOTHING;
 PERFORM public.wake_settlement_queue();
 RETURN NEW;
END $$;
