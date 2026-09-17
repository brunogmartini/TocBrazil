-- Fase 4: a consulta acontece fora da plataforma, então a realização é inferida.
-- Passada a janela de confirmação (padrão 24h após o fim), o sistema marca
-- automaticamente como realizada e registra confirmado_realizado_por = 'automatico'.
CREATE OR REPLACE FUNCTION public.concluir_consultas_vencidas()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
DECLARE
  n integer;
  janela integer;
BEGIN
  SELECT COALESCE((valor #>> '{}')::integer, 24) INTO janela
  FROM public.platform_settings WHERE chave = 'janela_confirmacao_horas';
  IF janela IS NULL THEN janela := 24; END IF;

  WITH concluidas AS (
    UPDATE public.appointments
    SET status = 'realizada',
        confirmado_realizado_por = 'automatico',
        confirmado_em = now(),
        realizada_em = COALESCE(realizada_em, now())
    WHERE status = 'confirmada'
      AND payment_status = 'aprovado'
      AND fim + (janela || ' hours')::interval <= now()
    RETURNING id, professional_id
  ), auditados AS (
    INSERT INTO public.eventos_auditoria (tipo, appointment_id, professional_id, ator_papel, metadados)
    SELECT 'realizacao_automatica', id, professional_id, 'sistema',
           jsonb_build_object('janela_horas', janela)
    FROM concluidas
    RETURNING 1
  )
  SELECT count(*) INTO n FROM concluidas;
  RETURN n;
END;
$function$;

REVOKE ALL ON FUNCTION public.concluir_consultas_vencidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.concluir_consultas_vencidas() TO service_role;

-- Relatório de metadados administrativos para a gestão.
CREATE OR REPLACE FUNCTION public.relatorio_metadados(_de timestamptz, _ate timestamptz)
 RETURNS TABLE(
   professional_id uuid,
   nome text,
   realizadas integer,
   canceladas_paciente integer,
   canceladas_profissional integer,
   nao_comparecimentos integer,
   expiradas integer,
   taxas_centavos integer
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'private', 'public'
AS $function$
  SELECT p.id,
         p.nome,
         COUNT(*) FILTER (WHERE a.status = 'realizada')::int,
         COUNT(*) FILTER (WHERE a.status = 'cancelada' AND a.cancelada_por = 'paciente')::int,
         COUNT(*) FILTER (WHERE a.status = 'cancelada' AND a.cancelada_por = 'profissional')::int,
         COUNT(*) FILTER (WHERE a.status = 'nao_compareceu')::int,
         COUNT(*) FILTER (WHERE a.status = 'expirado')::int,
         COALESCE(SUM(a.taxa_plataforma_centavos) FILTER (
           WHERE a.status IN ('realizada', 'nao_compareceu')), 0)::int
  FROM public.professionals p
  LEFT JOIN public.appointments a
    ON a.professional_id = p.id AND a.inicio >= _de AND a.inicio < _ate
  GROUP BY p.id, p.nome
  ORDER BY p.nome;
$function$;

REVOKE ALL ON FUNCTION public.relatorio_metadados(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.relatorio_metadados(timestamptz, timestamptz) TO service_role;