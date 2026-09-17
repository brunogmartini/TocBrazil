-- 1) Reviews: no direct table reads for anon/authenticated public listing
DROP POLICY IF EXISTS avaliacoes_public_view_select ON public.avaliacoes;

REVOKE ALL ON public.avaliacoes FROM anon;
REVOKE SELECT ON public.avaliacoes FROM authenticated;
GRANT INSERT, UPDATE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

-- 2) Public review view: definer view, no patient identifiers, moderated only
DROP VIEW IF EXISTS public.avaliacoes_publicas;
CREATE VIEW public.avaliacoes_publicas
WITH (security_invoker = false, security_barrier = true) AS
  SELECT id, professional_id, nota, comentario, created_at
  FROM public.avaliacoes
  WHERE publica = true AND moderacao = 'publicada';

GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;

-- 3) Rating summary must respect moderation too
CREATE OR REPLACE FUNCTION private.avaliacoes_resumo(_professional_id uuid)
RETURNS TABLE(media numeric, total integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
  SELECT COALESCE(ROUND(AVG(nota)::numeric, 2), 0), COUNT(*)::int
  FROM public.avaliacoes
  WHERE professional_id = _professional_id
    AND publica = true
    AND moderacao = 'publicada';
$function$;

-- 4) SECURITY DEFINER maintenance function must not be callable from the API roles
REVOKE EXECUTE ON FUNCTION public.expirar_reservas_vencidas() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expirar_reservas_vencidas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expirar_reservas_vencidas() TO service_role;

-- 5) Appointment messages: deletion explicitly denied (audit trail)
REVOKE DELETE ON public.appointment_messages FROM anon, authenticated;
REVOKE INSERT, UPDATE, SELECT ON public.appointment_messages FROM anon;
DROP POLICY IF EXISTS appointment_messages_no_delete ON public.appointment_messages;
CREATE POLICY appointment_messages_no_delete
  ON public.appointment_messages
  FOR DELETE
  TO authenticated
  USING (false);
