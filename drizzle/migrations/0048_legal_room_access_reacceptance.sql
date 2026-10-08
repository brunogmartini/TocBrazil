CREATE OR REPLACE FUNCTION public.appointment_room_access(_appointment_id uuid)
RETURNS TABLE(meeting_url text, suggestion_url text, meeting_url_updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments; owner_id uuid; minutes_before integer:=15;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT user_id INTO owner_id FROM public.professionals WHERE id=a.professional_id;
 IF (owner_id=auth.uid() OR a.patient_id=auth.uid()) AND NOT public.has_role(auth.uid(),'admin') AND NOT public.legal_access_allowed(auth.uid()) THEN RAISE EXCEPTION 'Aceite legal pendente: acesso a novas consultas bloqueado.' USING ERRCODE='42501'; END IF;
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
REVOKE ALL ON FUNCTION public.appointment_room_access(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.appointment_room_access(uuid) TO authenticated,service_role;
