CREATE OR REPLACE FUNCTION public.appointment_room_access(_appointment_id uuid)
RETURNS TABLE(meeting_url text, suggestion_url text, meeting_url_updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments; owner_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT user_id INTO owner_id FROM public.professionals WHERE id=a.professional_id;
 IF (owner_id=auth.uid() OR a.patient_id=auth.uid()) AND NOT public.has_role(auth.uid(),'admin') AND NOT public.legal_access_allowed(auth.uid()) THEN RAISE EXCEPTION 'Aceite legal pendente: acesso a novas consultas bloqueado.' USING ERRCODE='42501'; END IF;
 IF owner_id=auth.uid() OR public.has_role(auth.uid(),'admin') THEN
   RETURN QUERY SELECT a.meeting_url, CASE WHEN owner_id=auth.uid() THEN p.ferramenta_url_sala ELSE NULL END, a.meeting_url_updated_at FROM public.professionals p WHERE p.id=a.professional_id;
 ELSIF a.patient_id=auth.uid() THEN
   IF a.payment_status='aprovado' AND a.status IN ('confirmada','realizada') AND now()>=a.inicio-interval '30 minutes' AND now()<=a.fim+interval '2 hours' THEN
     RETURN QUERY SELECT a.meeting_url, NULL::text, a.meeting_url_updated_at;
   END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.appointment_room_access(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.appointment_room_access(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.appointment_paid_email_notice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE owner_id uuid;
BEGIN
 IF NEW.payment_status='aprovado' AND OLD.payment_status IS DISTINCT FROM 'aprovado' AND NEW.status='confirmada' THEN
   SELECT user_id INTO owner_id FROM public.professionals WHERE id=NEW.professional_id;
   IF owner_id IS NOT NULL THEN
     INSERT INTO public.notifications(user_id,appointment_id,tipo,canal,titulo,corpo,agendada_para)
     VALUES(owner_id,NEW.id,'consulta_confirmada_profissional','email','Consulta confirmada','O pagamento foi aprovado. Confira o horário na sua agenda.',now());
   END IF;
   UPDATE public.notifications SET tipo='lembrete_30min',titulo='Lembrete da consulta confirmada',agendada_para=NEW.inicio-interval '30 minutes'
   WHERE appointment_id=NEW.id AND tipo IN ('lembrete_15min','lembrete_30min') AND enviada_em IS NULL;
   IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE appointment_id=NEW.id AND tipo='lembrete_30min') THEN
     INSERT INTO public.notifications(user_id,appointment_id,tipo,canal,titulo,corpo,agendada_para)
     VALUES(NEW.patient_id,NEW.id,'lembrete_30min','email','Lembrete da consulta confirmada','O psicólogo entrará somente no horário marcado.',NEW.inicio-interval '30 minutes');
   END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.appointment_paid_email_notice() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.appointment_paid_email_notice() TO service_role;
CREATE TRIGGER appointment_paid_email_notice AFTER UPDATE OF payment_status ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.appointment_paid_email_notice();