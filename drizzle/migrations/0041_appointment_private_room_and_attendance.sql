ALTER TABLE public.appointments
 ADD COLUMN meeting_url text,
 ADD COLUMN meeting_url_updated_at timestamptz,
 ADD COLUMN professional_confirmed_at timestamptz,
 ADD COLUMN patient_confirmed_at timestamptz,
 ADD COLUMN attendance_status text NOT NULL DEFAULT 'agendada',
 ADD COLUMN attendance_decided_by uuid,
 ADD COLUMN attendance_decided_at timestamptz,
 ADD COLUMN attendance_justification text,
 ADD COLUMN attendance_observation text;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_attendance_status_valid CHECK (attendance_status IN ('agendada','em_analise','realizada','falta_paciente','falta_profissional'));
COMMENT ON COLUMN public.appointments.link_acesso IS 'DEPRECATED: private legacy link; replaced by meeting_url through authorized RPC only';
COMMENT ON COLUMN public.appointments.video_url IS 'DEPRECATED: private legacy link; replaced by meeting_url through authorized RPC only';

-- Table SELECT overrides column grants: remove it before granting only safe columns.
REVOKE SELECT, UPDATE ON public.appointments FROM authenticated, anon;
DO $$ DECLARE cols text; writable text; BEGIN
 SELECT string_agg(quote_ident(attname), ', ') INTO cols FROM pg_attribute WHERE attrelid='public.appointments'::regclass AND attnum>0 AND NOT attisdropped AND attname NOT IN ('meeting_url','link_acesso','video_url','attendance_justification','attendance_observation');
 EXECUTE 'GRANT SELECT (' || cols || ') ON public.appointments TO authenticated';
 SELECT string_agg(quote_ident(attname), ', ') INTO writable FROM pg_attribute WHERE attrelid='public.appointments'::regclass AND attnum>0 AND NOT attisdropped AND attname NOT IN ('meeting_url','meeting_url_updated_at','link_acesso','video_url','professional_confirmed_at','patient_confirmed_at','attendance_status','attendance_decided_by','attendance_decided_at','attendance_justification','attendance_observation');
 EXECUTE 'GRANT UPDATE (' || writable || ') ON public.appointments TO authenticated';
END $$;
GRANT ALL ON public.appointments TO service_role;

CREATE OR REPLACE FUNCTION public.appointment_room_access(_appointment_id uuid)
RETURNS TABLE(meeting_url text, suggestion_url text, meeting_url_updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments; owner_id uuid; minutes_before integer:=15;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT user_id INTO owner_id FROM public.professionals WHERE id=a.professional_id;
 IF owner_id=auth.uid() OR public.has_role(auth.uid(),'admin') THEN
   RETURN QUERY SELECT a.meeting_url, CASE WHEN owner_id=auth.uid() THEN p.ferramenta_url_sala ELSE NULL END, a.meeting_url_updated_at FROM public.professionals p WHERE p.id=a.professional_id;
 ELSIF a.patient_id=auth.uid() THEN
   SELECT CASE WHEN jsonb_typeof(valor)='number' THEN greatest(0,least(120,(valor #>> '{}')::integer)) ELSE 15 END INTO minutes_before FROM public.platform_settings WHERE chave='antecedencia_link_minutos';
   minutes_before:=coalesce(minutes_before,15);
   IF a.payment_status='aprovado' AND a.status IN ('confirmada','realizada') AND now()>=a.inicio-make_interval(mins=>minutes_before) AND now()<=a.fim+interval '2 hours' THEN
     RETURN QUERY SELECT a.meeting_url, NULL::text, a.meeting_url_updated_at;
   END IF;
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.appointment_room_update(_appointment_id uuid,_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=a.professional_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 IF a.inicio<=now() OR a.status NOT IN ('confirmada','aguardando_pagamento') THEN RAISE EXCEPTION 'O link só pode ser editado antes do início da consulta.'; END IF;
 IF length(_url)>2048 OR _url !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?([:/?#][^[:space:]]*)?$' OR _url ~ '@' THEN RAISE EXCEPTION 'Informe uma URL HTTPS válida.'; END IF;
 UPDATE public.appointments SET meeting_url=_url,meeting_url_updated_at=now() WHERE id=a.id;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),'profissional','appointment_status_changed','appointment',a.id,'{"fields":["meeting_url"]}');
END $$;

CREATE OR REPLACE FUNCTION public.appointment_attendance_confirm(_appointment_id uuid,_side text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR (_side='paciente' AND a.patient_id<>auth.uid()) OR (_side='profissional' AND NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=a.professional_id AND user_id=auth.uid())) OR _side NOT IN ('paciente','profissional') THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 IF a.status NOT IN ('confirmada','realizada') OR now()<a.inicio OR now()>a.inicio+interval '24 hours' OR a.attendance_decided_at IS NOT NULL THEN RAISE EXCEPTION 'A confirmação está disponível do início até 24 horas depois.'; END IF;
 UPDATE public.appointments SET
 professional_confirmed_at=CASE WHEN _side='profissional' THEN coalesce(professional_confirmed_at,now()) ELSE professional_confirmed_at END,
 patient_confirmed_at=CASE WHEN _side='paciente' THEN coalesce(patient_confirmed_at,now()) ELSE patient_confirmed_at END
 WHERE id=a.id;
 UPDATE public.appointments SET attendance_status='realizada' WHERE id=a.id AND professional_confirmed_at IS NOT NULL AND patient_confirmed_at IS NOT NULL;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),_side,'appointment_status_changed','appointment',a.id,jsonb_build_object('fields',ARRAY[CASE WHEN _side='paciente' THEN 'patient_confirmed_at' ELSE 'professional_confirmed_at' END]));
END $$;

CREATE OR REPLACE FUNCTION public.appointment_attendance_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN
   IF coalesce(auth.role(),'')<>'service_role' AND auth.uid() IS NOT NULL THEN
     NEW.meeting_url:=NULL; NEW.meeting_url_updated_at:=NULL;
     NEW.link_acesso:=NULL; NEW.video_url:=NULL;
     NEW.professional_confirmed_at:=NULL; NEW.patient_confirmed_at:=NULL;
     NEW.attendance_status:='agendada'; NEW.attendance_decided_at:=NULL; NEW.attendance_decided_by:=NULL; NEW.attendance_justification:=NULL; NEW.attendance_observation:=NULL;
   END IF;
 ELSE
   IF OLD.professional_confirmed_at IS NOT NULL AND NEW.professional_confirmed_at IS DISTINCT FROM OLD.professional_confirmed_at THEN RAISE EXCEPTION 'Confirmação profissional imutável.'; END IF;
   IF OLD.patient_confirmed_at IS NOT NULL AND NEW.patient_confirmed_at IS DISTINCT FROM OLD.patient_confirmed_at THEN RAISE EXCEPTION 'Confirmação do paciente imutável.'; END IF;
   IF OLD.attendance_decided_at IS NOT NULL AND (NEW.attendance_status IS DISTINCT FROM OLD.attendance_status OR NEW.attendance_decided_by IS DISTINCT FROM OLD.attendance_decided_by OR NEW.attendance_decided_at IS DISTINCT FROM OLD.attendance_decided_at OR NEW.attendance_justification IS DISTINCT FROM OLD.attendance_justification OR NEW.attendance_observation IS DISTINCT FROM OLD.attendance_observation) THEN RAISE EXCEPTION 'Decisão de presença imutável.'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER appointments_attendance_guard BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.appointment_attendance_guard();

CREATE OR REPLACE FUNCTION public.concluir_consultas_vencidas()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE n integer;
BEGIN
 UPDATE public.appointments SET attendance_status='em_analise' WHERE attendance_status='agendada' AND status='confirmada' AND inicio+interval '24 hours'<now() AND (professional_confirmed_at IS NULL OR patient_confirmed_at IS NULL);
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.appointment_attendance_reviews()
RETURNS TABLE(id uuid,inicio timestamptz,fim timestamptz,patient_id uuid,professional_id uuid,professional_name text,professional_confirmed_at timestamptz,patient_confirmed_at timestamptz,attendance_status text,attendance_observation text,attendance_justification text,attendance_decided_by uuid,attendance_decided_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito à gestão.' USING ERRCODE='42501'; END IF;
 PERFORM public.concluir_consultas_vencidas();
 RETURN QUERY SELECT a.id,a.inicio,a.fim,a.patient_id,a.professional_id,p.nome,a.professional_confirmed_at,a.patient_confirmed_at,a.attendance_status,a.attendance_observation,a.attendance_justification,a.attendance_decided_by,a.attendance_decided_at FROM public.appointments a JOIN public.professionals p ON p.id=a.professional_id WHERE a.attendance_status='em_analise' OR a.attendance_decided_at IS NOT NULL ORDER BY a.inicio DESC;
END $$;

CREATE OR REPLACE FUNCTION public.appointment_attendance_decide(_appointment_id uuid,_status text,_justification text,_observation text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito à gestão.' USING ERRCODE='42501'; END IF;
 IF _status NOT IN ('realizada','falta_paciente','falta_profissional') OR length(trim(coalesce(_justification,'')))<3 OR length(_justification)>2000 OR length(coalesce(_observation,''))>2000 THEN RAISE EXCEPTION 'Informe uma decisão e sua justificativa.'; END IF;
 UPDATE public.appointments SET attendance_status=_status,attendance_justification=trim(_justification),attendance_observation=nullif(trim(_observation),''),attendance_decided_by=auth.uid(),attendance_decided_at=now() WHERE id=_appointment_id AND attendance_status='em_analise' AND attendance_decided_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Consulta não está em análise.'; END IF;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),'admin','appointment_status_changed','appointment',_appointment_id,jsonb_build_object('fields',ARRAY['attendance_status','attendance_justification','attendance_observation','attendance_decided_by','attendance_decided_at']));
END $$;
REVOKE ALL ON FUNCTION public.appointment_room_access(uuid),public.appointment_room_update(uuid,text),public.appointment_attendance_confirm(uuid,text),public.appointment_attendance_reviews(),public.appointment_attendance_decide(uuid,text,text,text),public.appointment_attendance_guard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.appointment_room_access(uuid),public.appointment_room_update(uuid,text),public.appointment_attendance_confirm(uuid,text),public.appointment_attendance_reviews(),public.appointment_attendance_decide(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.concluir_consultas_vencidas() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.concluir_consultas_vencidas() TO service_role;