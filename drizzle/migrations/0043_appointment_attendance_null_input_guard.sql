CREATE OR REPLACE FUNCTION public.appointment_attendance_confirm(_appointment_id uuid,_side text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 IF _side IS NULL OR _side NOT IN ('paciente','profissional') THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR (_side='paciente' AND a.patient_id<>auth.uid()) OR (_side='profissional' AND NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=a.professional_id AND user_id=auth.uid())) THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 IF a.status NOT IN ('confirmada','realizada') OR now()<a.inicio OR now()>a.inicio+interval '24 hours' OR a.attendance_decided_at IS NOT NULL THEN RAISE EXCEPTION 'A confirmação está disponível do início até 24 horas depois.'; END IF;
 IF (_side='paciente' AND a.patient_confirmed_at IS NOT NULL) OR (_side='profissional' AND a.professional_confirmed_at IS NOT NULL) THEN RETURN; END IF;
 UPDATE public.appointments SET professional_confirmed_at=CASE WHEN _side='profissional' THEN now() ELSE professional_confirmed_at END, patient_confirmed_at=CASE WHEN _side='paciente' THEN now() ELSE patient_confirmed_at END WHERE id=a.id;
 UPDATE public.appointments SET attendance_status='realizada' WHERE id=a.id AND professional_confirmed_at IS NOT NULL AND patient_confirmed_at IS NOT NULL;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),_side,'appointment_status_changed','appointment',a.id,jsonb_build_object('fields',ARRAY[CASE WHEN _side='paciente' THEN 'patient_confirmed_at' ELSE 'professional_confirmed_at' END]));
END $$;
CREATE OR REPLACE FUNCTION public.appointment_attendance_decide(_appointment_id uuid,_status text,_justification text,_observation text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito à gestão.' USING ERRCODE='42501'; END IF;
 IF _status IS NULL OR _status NOT IN ('realizada','falta_paciente','falta_profissional') OR length(trim(coalesce(_justification,'')))<3 OR length(_justification)>2000 OR length(coalesce(_observation,''))>2000 THEN RAISE EXCEPTION 'Informe uma decisão e sua justificativa.'; END IF;
 UPDATE public.appointments SET attendance_status=_status,attendance_justification=trim(_justification),attendance_observation=nullif(trim(_observation),''),attendance_decided_by=auth.uid(),attendance_decided_at=now() WHERE id=_appointment_id AND attendance_status='em_analise' AND attendance_decided_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Consulta não está em análise.'; END IF;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),'admin','appointment_status_changed','appointment',_appointment_id,jsonb_build_object('fields',ARRAY['attendance_status','attendance_justification','attendance_observation','attendance_decided_by','attendance_decided_at']));
END $$;