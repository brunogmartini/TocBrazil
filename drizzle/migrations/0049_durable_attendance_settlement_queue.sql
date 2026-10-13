-- lovable-cron-fallback-reviewed: bounded queue wakes on enqueue and unschedules after drain; known future end times and retry deadlines require two-minute fallback
CREATE TABLE public.appointment_settlement_jobs (
 appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id), outcome text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','retry','done','review')),
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), locked_until timestamptz, claim_token uuid, failure_code text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.appointment_settlement_jobs TO service_role;
ALTER TABLE public.appointment_settlement_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY settlement_jobs_deny ON public.appointment_settlement_jobs FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE INDEX settlement_jobs_due ON public.appointment_settlement_jobs(status,available_at);
ALTER TABLE public.asaas_sandbox_test_runs ADD COLUMN settlement_status text NOT NULL DEFAULT 'pending', ADD COLUMN settlement_outcome text, ADD COLUMN settlement_claim uuid, ADD COLUMN settlement_locked_until timestamptz, ADD COLUMN captured_centavos integer NOT NULL DEFAULT 0;
CREATE FUNCTION public.wake_settlement_queue() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE job_id bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('attendance-payment-settlement'));
 IF EXISTS(SELECT 1 FROM public.appointment_settlement_jobs WHERE status IN ('pending','retry','processing')) THEN
  IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='attendance-payment-settlement') THEN
   PERFORM cron.schedule('attendance-payment-settlement','*/2 * * * *',$cmd$SELECT public.wake_settlement_queue();$cmd$);
  END IF;
  IF EXISTS(SELECT 1 FROM public.appointment_settlement_jobs WHERE available_at<=now() AND (status IN ('pending','retry') OR (status='processing' AND locked_until<now()))) THEN
   PERFORM net.http_post(url:='https://tocbrazil.com.br/api/public/pagamentos/liquidar',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(SELECT token FROM private.cron_token WHERE nome='notificacoes')),body:='{}'::jsonb);
  END IF;
 ELSE
  SELECT jobid INTO job_id FROM cron.job WHERE jobname='attendance-payment-settlement';
  IF job_id IS NOT NULL THEN PERFORM cron.unschedule(job_id); END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.wake_settlement_queue() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wake_settlement_queue() TO service_role;
CREATE FUNCTION public.enqueue_attendance_settlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target text;
BEGIN
 IF NEW.attendance_status IS NOT DISTINCT FROM OLD.attendance_status THEN RETURN NEW; END IF;
 IF NEW.attendance_status='realizada' AND ((NEW.patient_confirmed_at IS NOT NULL AND NEW.professional_confirmed_at IS NOT NULL) OR NEW.attendance_decided_at IS NOT NULL) THEN target:='REALIZADA';
 ELSIF NEW.attendance_status='falta_paciente' AND NEW.attendance_decided_at IS NOT NULL THEN target:='FALTA_PACIENTE';
 ELSIF NEW.attendance_status='falta_profissional' AND NEW.attendance_decided_at IS NOT NULL THEN target:='FALTA_PROFISSIONAL';
 ELSE RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.asaas_payment_authorizations WHERE appointment_id=NEW.id) THEN RETURN NEW; END IF;
 INSERT INTO public.appointment_settlement_jobs(appointment_id,outcome,available_at) VALUES(NEW.id,target,greatest(now(),NEW.fim)) ON CONFLICT(appointment_id) DO NOTHING;
 PERFORM public.wake_settlement_queue();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_attendance_settlement() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_attendance_settlement() TO service_role;
CREATE TRIGGER attendance_settlement_enqueue AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.enqueue_attendance_settlement();
CREATE FUNCTION public.claim_appointment_settlement(_id uuid) RETURNS SETOF public.appointment_settlement_jobs LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 UPDATE public.appointment_settlement_jobs SET status='processing',attempts=attempts+1,claim_token=gen_random_uuid(),locked_until=now()+interval '5 minutes',updated_at=now() WHERE appointment_id=_id AND attempts<5 AND available_at<=now() AND (status IN ('pending','retry') OR (status='processing' AND locked_until<now())) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_appointment_settlement(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_appointment_settlement(uuid) TO service_role;
CREATE FUNCTION public.finish_appointment_settlement(_id uuid,_claim uuid,_captured integer,_platform integer,_professional integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE j public.appointment_settlement_jobs;
BEGIN
 SELECT * INTO j FROM public.appointment_settlement_jobs WHERE appointment_id=_id AND claim_token=_claim AND status='processing' AND locked_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.appointments SET settlement_status='EXECUTADO',outcome=j.outcome,settled_at=now(),amount_captured_centavos=_captured,platform_amount_centavos=_platform,professional_amount_centavos=_professional,valor_plataforma_centavos=_platform,valor_profissional_centavos=_professional,payment_status=CASE WHEN _captured>0 THEN 'aprovado'::public.payment_status ELSE 'cancelado'::public.payment_status END WHERE id=_id;
 UPDATE public.appointment_settlement_jobs SET status='done',locked_until=NULL,updated_at=now(),failure_code=NULL WHERE appointment_id=_id;
 INSERT INTO public.audit_log(actor_role,action,entity,entity_id,metadata) VALUES('sistema','payment_settlement_completed','appointment',_id,jsonb_build_object('fields',ARRAY['settlement_status','amount_captured_centavos','outcome']));
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.finish_appointment_settlement(uuid,uuid,integer,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_appointment_settlement(uuid,uuid,integer,integer,integer) TO service_role;
CREATE FUNCTION public.claim_sandbox_settlement(_id uuid,_outcome text) RETURNS SETOF public.asaas_sandbox_test_runs LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 UPDATE public.asaas_sandbox_test_runs SET settlement_status='processing',settlement_outcome=_outcome,settlement_claim=gen_random_uuid(),settlement_locked_until=now()+interval '5 minutes' WHERE id=_id AND _outcome IN ('REALIZADA','FALTA_PACIENTE','FALTA_PROFISSIONAL') AND (settlement_outcome IS NULL OR settlement_outcome=_outcome) AND (settlement_status IN ('pending','retry') OR (settlement_status='processing' AND settlement_locked_until<now())) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_sandbox_settlement(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sandbox_settlement(uuid,text) TO service_role;