-- Reservas não pagas expiram e liberam o horário
CREATE OR REPLACE FUNCTION public.expirar_reservas_vencidas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.appointments
  SET status = 'expirado'
  WHERE status = 'aguardando_pagamento'
    AND payment_status <> 'aprovado'
    AND reserva_expira_em IS NOT NULL
    AND reserva_expira_em < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.expirar_reservas_vencidas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expirar_reservas_vencidas() TO anon, authenticated, service_role;

-- Horários livres ignoram reservas já expiradas
CREATE OR REPLACE FUNCTION private.slots_disponiveis(_slug text, _dias integer DEFAULT 21)
RETURNS TABLE(inicio timestamp with time zone, fim timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $$
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
        AND (
          a.status IN ('confirmada','realizada')
          OR (a.status = 'aguardando_pagamento' AND (a.reserva_expira_em IS NULL OR a.reserva_expira_em > now()))
        )
        AND a.inicio < s.inicio + make_interval(mins => s.slot_minutos) AND a.fim > s.inicio
    )
  ORDER BY s.inicio;
$$;

-- Próximos horários de todos os perfis publicados, para ordenar a busca pública
CREATE OR REPLACE FUNCTION private.proximos_horarios(_dias integer DEFAULT 21, _limite integer DEFAULT 3)
RETURNS TABLE(slug text, inicio timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $$
  SELECT pr.slug, h.inicio
  FROM public.professionals pr
  JOIN LATERAL (
    SELECT s.inicio FROM private.slots_disponiveis(pr.slug, _dias) s
    ORDER BY s.inicio LIMIT GREATEST(_limite, 1)
  ) h ON true
  WHERE pr.status = 'aprovado'
  ORDER BY pr.slug, h.inicio;
$$;

CREATE OR REPLACE FUNCTION public.proximos_horarios(_dias integer, _limite integer)
RETURNS TABLE(slug text, inicio timestamp with time zone)
LANGUAGE sql
STABLE
SET search_path TO 'private', 'public'
AS $$ SELECT h.slug, h.inicio FROM private.proximos_horarios(_dias, _limite) h $$;

REVOKE ALL ON FUNCTION private.proximos_horarios(integer, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.proximos_horarios(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.proximos_horarios(integer, integer) TO anon, authenticated, service_role;
