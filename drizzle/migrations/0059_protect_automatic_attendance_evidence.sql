CREATE FUNCTION public.guard_automatic_attendance_evidence() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN NEW.attendance_auto_completed_at:=NULL;
 ELSIF OLD.attendance_auto_completed_at IS NOT NULL AND NEW.attendance_auto_completed_at IS DISTINCT FROM OLD.attendance_auto_completed_at THEN RAISE EXCEPTION 'Registro automático imutável.';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_automatic_attendance_evidence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER appointments_guard_automatic_attendance BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_automatic_attendance_evidence();
CREATE OR REPLACE FUNCTION public.enqueue_attendance_settlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target text; due timestamptz;
BEGIN
 IF NEW.attendance_status IS NOT DISTINCT FROM OLD.attendance_status THEN RETURN NEW; END IF;
 IF NEW.payment_status<>'aprovado' THEN RETURN NEW; END IF;
 IF NEW.attendance_status='em_analise' THEN
  UPDATE public.appointment_settlement_jobs SET status='review',locked_until=NULL,failure_code='ATTENDANCE_DISPUTED' WHERE appointment_id=NEW.id AND status IN ('pending','retry','processing');
  RETURN NEW;
 END IF;
 IF NEW.attendance_status='realizada' AND ((NEW.patient_confirmed_at IS NOT NULL AND NEW.professional_confirmed_at IS NOT NULL) OR NEW.attendance_decided_at IS NOT NULL OR NEW.attendance_auto_completed_at IS NOT NULL) THEN target:='REALIZADA';
 ELSIF NEW.attendance_status='falta_paciente' AND NEW.attendance_decided_at IS NOT NULL THEN target:='FALTA_PACIENTE';
 ELSIF NEW.attendance_status='falta_profissional' AND NEW.attendance_decided_at IS NOT NULL THEN target:='FALTA_PROFISSIONAL';
 ELSE RETURN NEW; END IF;
 IF NEW.asaas_payment_id IS NULL AND NOT EXISTS(SELECT 1 FROM public.asaas_payment_authorizations WHERE appointment_id=NEW.id) THEN RETURN NEW; END IF;
 due:=CASE WHEN NEW.attendance_decided_at IS NULL THEN greatest(now(),NEW.fim+interval '48 hours') ELSE greatest(now(),NEW.fim) END;
 INSERT INTO public.appointment_settlement_jobs(appointment_id,outcome,available_at) VALUES(NEW.id,target,due) ON CONFLICT(appointment_id) DO UPDATE SET outcome=EXCLUDED.outcome,status='pending',failure_code=NULL,available_at=EXCLUDED.available_at,attempts=0 WHERE appointment_settlement_jobs.status='review' AND appointment_settlement_jobs.failure_code='ATTENDANCE_DISPUTED';
 PERFORM public.wake_settlement_queue();
 RETURN NEW;
END $$;