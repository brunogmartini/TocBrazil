CREATE OR REPLACE FUNCTION public.slots_disponiveis(_slug text, _dias int DEFAULT 21)
RETURNS TABLE (inicio timestamptz, fim timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
      (d.dia::text || ' ' || r.hora_inicio::text)::timestamp,
      (d.dia::text || ' ' || r.hora_fim::text)::timestamp - make_interval(mins => p.slot_minutos),
      make_interval(mins => p.slot_minutos)
    ) AS t(h) ON true
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
        AND a.status IN ('aguardando_pagamento','confirmada','realizada')
        AND a.inicio < s.inicio + make_interval(mins => s.slot_minutos) AND a.fim > s.inicio
    )
  ORDER BY s.inicio;
$$;
REVOKE EXECUTE ON FUNCTION public.slots_disponiveis(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slots_disponiveis(text, int) TO anon, authenticated, service_role;