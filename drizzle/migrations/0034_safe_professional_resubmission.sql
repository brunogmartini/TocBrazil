CREATE OR REPLACE FUNCTION public.reenviar_cadastro_profissional(_professional_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  UPDATE public.professionals
  SET status = 'pendente', requer_correcao = false
  WHERE id = _professional_id AND user_id = auth.uid() AND status = 'rejeitado';
  RETURN FOUND;
END;
$function$;
REVOKE ALL ON FUNCTION public.reenviar_cadastro_profissional(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reenviar_cadastro_profissional(uuid) TO authenticated, service_role;