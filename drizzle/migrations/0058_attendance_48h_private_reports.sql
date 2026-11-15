ALTER TABLE public.appointments ADD COLUMN attendance_auto_completed_at timestamptz;
GRANT SELECT(attendance_auto_completed_at) ON public.appointments TO authenticated;
CREATE TABLE public.appointment_attendance_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id uuid NOT NULL REFERENCES public.appointments(id), author_id uuid NOT NULL, side text NOT NULL CHECK(side IN ('paciente','profissional')), reason text NOT NULL CHECK(length(trim(reason)) BETWEEN 3 AND 1000), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(appointment_id,side)
);
GRANT SELECT ON public.appointment_attendance_reports TO authenticated;
GRANT ALL ON public.appointment_attendance_reports TO service_role;
ALTER TABLE public.appointment_attendance_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_reports_participants ON public.appointment_attendance_reports FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=appointment_id AND (a.patient_id=auth.uid() OR EXISTS(SELECT 1 FROM public.professionals p WHERE p.id=a.professional_id AND p.user_id=auth.uid()))) OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.attendance_report_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN RAISE EXCEPTION 'Motivo registrado é imutável.'; END $$;
REVOKE ALL ON FUNCTION public.attendance_report_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER attendance_reports_immutable BEFORE UPDATE OR DELETE ON public.appointment_attendance_reports FOR EACH ROW EXECUTE FUNCTION public.attendance_report_immutable();
CREATE FUNCTION public.appointment_attendance_details(_appointment_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT(a.patient_id=auth.uid() OR EXISTS(SELECT 1 FROM public.professionals p WHERE p.id=a.professional_id AND p.user_id=auth.uid()) OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('fim',a.fim,'payment_status',a.payment_status,'automatic_at',a.attendance_auto_completed_at,'decided_at',a.attendance_decided_at,'reports',coalesce((SELECT jsonb_agg(jsonb_build_object('side',r.side,'reason',r.reason,'created_at',r.created_at) ORDER BY r.created_at) FROM public.appointment_attendance_reports r WHERE r.appointment_id=a.id),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.appointment_attendance_details(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.appointment_attendance_details(uuid) TO authenticated;
CREATE FUNCTION public.appointment_attendance_report(_appointment_id uuid,_side text,_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR _side IS NULL OR _side NOT IN ('paciente','profissional') OR (_side='paciente' AND a.patient_id<>auth.uid()) OR (_side='profissional' AND NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=a.professional_id AND user_id=auth.uid())) THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 IF a.payment_status<>'aprovado' OR a.status NOT IN ('confirmada','realizada') OR now()<a.fim OR now()>a.fim+interval '48 hours' OR a.attendance_decided_at IS NOT NULL OR a.attendance_auto_completed_at IS NOT NULL OR a.settlement_status='EXECUTADO' THEN RAISE EXCEPTION 'O relato está disponível após o término, por até 48 horas e antes da conclusão financeira.'; END IF;
 IF length(trim(coalesce(_reason,'')))<3 OR length(_reason)>1000 THEN RAISE EXCEPTION 'Informe um motivo administrativo de 3 a 1000 caracteres.'; END IF;
 INSERT INTO public.appointment_attendance_reports(appointment_id,author_id,side,reason) VALUES(a.id,auth.uid(),_side,trim(_reason));
 UPDATE public.appointments SET attendance_status='em_analise' WHERE id=a.id;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),_side,'appointment_status_changed','appointment',a.id,'{"fields":["attendance_status"]}');
END $$;
REVOKE ALL ON FUNCTION public.appointment_attendance_report(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.appointment_attendance_report(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.appointment_attendance_confirm(_appointment_id uuid,_side text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR _side IS NULL OR _side NOT IN ('paciente','profissional') OR (_side='paciente' AND a.patient_id<>auth.uid()) OR (_side='profissional' AND NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=a.professional_id AND user_id=auth.uid())) THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 IF a.payment_status<>'aprovado' OR a.status NOT IN ('confirmada','realizada') OR now()<a.fim OR now()>a.fim+interval '48 hours' OR a.attendance_decided_at IS NOT NULL OR a.attendance_auto_completed_at IS NOT NULL THEN RAISE EXCEPTION 'Confirme após o término, até 48 horas depois.'; END IF;
 UPDATE public.appointments SET professional_confirmed_at=CASE WHEN _side='profissional' THEN coalesce(professional_confirmed_at,now()) ELSE professional_confirmed_at END,patient_confirmed_at=CASE WHEN _side='paciente' THEN coalesce(patient_confirmed_at,now()) ELSE patient_confirmed_at END WHERE id=a.id;
 UPDATE public.appointments SET attendance_status='realizada' WHERE id=a.id AND professional_confirmed_at IS NOT NULL AND patient_confirmed_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.appointment_attendance_reports r WHERE r.appointment_id=a.id);
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),_side,'appointment_status_changed','appointment',a.id,jsonb_build_object('fields',ARRAY[CASE WHEN _side='paciente' THEN 'patient_confirmed_at' ELSE 'professional_confirmed_at' END]));
END $$;
CREATE OR REPLACE FUNCTION public.concluir_consultas_vencidas() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments; n integer:=0;
BEGIN
 FOR a IN SELECT * FROM public.appointments WHERE attendance_status IN ('agendada','em_analise') AND attendance_decided_at IS NULL AND attendance_auto_completed_at IS NULL AND status='confirmada' AND payment_status='aprovado' AND fim+interval '48 hours'<=now() FOR UPDATE SKIP LOCKED LOOP
  IF a.professional_confirmed_at IS NOT NULL AND a.patient_confirmed_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.appointment_attendance_reports r WHERE r.appointment_id=a.id) THEN
   UPDATE public.appointments SET attendance_status='realizada',attendance_auto_completed_at=now() WHERE id=a.id;
   INSERT INTO public.audit_log(actor_role,action,entity,entity_id,metadata) VALUES('sistema','appointment_status_changed','appointment',a.id,'{"fields":["attendance_status","attendance_auto_completed_at"]}');
   n:=n+1;
  ELSIF a.attendance_status='agendada' THEN
   UPDATE public.appointments SET attendance_status='em_analise' WHERE id=a.id;
   n:=n+1;
  END IF;
 END LOOP;
 RETURN n;
END $$;
CREATE OR REPLACE FUNCTION public.enqueue_attendance_settlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target text;
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
 INSERT INTO public.appointment_settlement_jobs(appointment_id,outcome,available_at) VALUES(NEW.id,target,greatest(now(),NEW.fim)) ON CONFLICT(appointment_id) DO UPDATE SET outcome=EXCLUDED.outcome,status='pending',failure_code=NULL,available_at=EXCLUDED.available_at,attempts=0 WHERE appointment_settlement_jobs.status='review' AND appointment_settlement_jobs.failure_code='ATTENDANCE_DISPUTED';
 PERFORM public.wake_settlement_queue();
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.finish_appointment_settlement(_id uuid,_claim uuid,_captured integer,_platform integer,_professional integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE j public.appointment_settlement_jobs; a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_id FOR UPDATE;
 SELECT * INTO j FROM public.appointment_settlement_jobs WHERE appointment_id=_id AND claim_token=_claim AND status='processing' AND locked_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF _captured IS NULL OR _platform IS NULL OR _professional IS NULL OR least(_captured,_platform,_professional)<0 OR _captured<>_platform+_professional THEN RAISE EXCEPTION 'Valores financeiros inválidos.'; END IF;
 IF j.outcome='REALIZADA' AND (a.attendance_status<>'realizada' OR a.payment_status<>'aprovado') THEN RETURN false; END IF;
 IF j.outcome='FALTA_PACIENTE' AND a.attendance_status<>'falta_paciente' THEN RETURN false; END IF;
 IF j.outcome='FALTA_PROFISSIONAL' AND a.attendance_status<>'falta_profissional' THEN RETURN false; END IF;
 UPDATE public.appointments SET settlement_status='EXECUTADO',outcome=j.outcome,settled_at=now(),amount_captured_centavos=_captured,platform_amount_centavos=_platform,professional_amount_centavos=_professional,valor_plataforma_centavos=_platform,valor_profissional_centavos=_professional,payment_status=CASE WHEN _captured>0 THEN 'aprovado'::public.payment_status ELSE 'cancelado'::public.payment_status END WHERE id=_id;
 UPDATE public.appointment_settlement_jobs SET status='done',locked_until=NULL,updated_at=now(),failure_code=NULL WHERE appointment_id=_id;
 INSERT INTO public.audit_log(actor_role,action,entity,entity_id,metadata) VALUES('sistema','appointment_status_changed','appointment',_id,jsonb_build_object('fields',ARRAY['settlement_status','amount_captured_centavos','outcome']));
 RETURN true;
END $$;
COMMENT ON COLUMN public.appointments.attendance_auto_completed_at IS 'System completion after paid consultation end +48h, with professional confirmation and no administrative dispute. Never substitutes patient evidence.';