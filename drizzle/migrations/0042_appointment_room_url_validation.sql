CREATE OR REPLACE FUNCTION public.appointment_room_update(_appointment_id uuid,_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.appointments;
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=_appointment_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=a.professional_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Consulta não encontrada.' USING ERRCODE='42501'; END IF;
 IF a.inicio<=now() OR a.status NOT IN ('confirmada','aguardando_pagamento') THEN RAISE EXCEPTION 'O link só pode ser editado antes do início da consulta.'; END IF;
 IF _url IS NULL OR length(_url)>2048 OR _url !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?([:/?#][^[:space:]]*)?$' OR _url ~ '@' THEN RAISE EXCEPTION 'Informe uma URL HTTPS válida.'; END IF;
 UPDATE public.appointments SET meeting_url=_url,meeting_url_updated_at=now() WHERE id=a.id;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),'profissional','appointment_status_changed','appointment',a.id,'{"fields":["meeting_url"]}');
END $$;