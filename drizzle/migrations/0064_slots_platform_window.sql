CREATE OR REPLACE FUNCTION private.slots_disponiveis(_slug text, _dias integer DEFAULT 21)
 RETURNS TABLE(inicio timestamp with time zone, fim timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'private', 'public'
AS $function$
  WITH p AS (
    SELECT id, slot_minutos FROM public.professionals WHERE slug = _slug AND status = 'aprovado'
  ),
  dias AS (
    SELECT (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')::date + i) AS dia
    FROM generate_series(0, GREATEST(_dias,1)) AS i
  ),
  slots AS (
    SELECT ((d.dia::text || ' ' || to_char(t.h, 'HH24:MI'))::timestamp AT TIME ZONE 'America/Sao_Paulo') AS inicio,
           p.slot_minutos
    FROM p
    JOIN dias d ON true
    JOIN public.availability_rules r ON r.professional_id = p.id
      AND r.weekday = EXTRACT(DOW FROM d.dia)::int
    JOIN LATERAL generate_series(
      (d.dia::text || ' ' || GREATEST(r.hora_inicio, time '08:00')::text)::timestamp,
      (d.dia::text || ' ' || LEAST(r.hora_fim, CASE WHEN EXTRACT(DOW FROM d.dia)::int = 6 THEN time '11:00' ELSE time '18:00' END)::text)::timestamp - make_interval(mins => p.slot_minutos),
      make_interval(mins => p.slot_minutos)
    ) AS t(h) ON true
    WHERE EXTRACT(DOW FROM d.dia)::int BETWEEN 1 AND 6
  )
  SELECT s.inicio, s.inicio + make_interval(mins => s.slot_minutos) AS fim
  FROM slots s, p
  WHERE s.inicio > now() + interval '2 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.availability_blocks b
      WHERE b.professional_id = p.id AND b.inicio < s.inicio + make_interval(mins => s.slot_minutos) AND b.fim > s.inicio
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.professional_id = p.id
        AND (
          a.status IN ('confirmada','realizada')
          OR (a.status = 'aguardando_pagamento' AND (a.reserva_expira_em IS NULL OR a.reserva_expira_em > now()))
        )
        AND a.inicio < s.inicio + make_interval(mins => s.slot_minutos) AND a.fim > s.inicio
    )
  ORDER BY s.inicio;
$function$;