ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS cpf text;

CREATE OR REPLACE FUNCTION public.appointments_on_realizada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  taxa_fixa integer;
BEGIN
  IF NEW.status = 'realizada' AND OLD.status IS DISTINCT FROM 'realizada' THEN
    taxa_fixa := COALESCE(NEW.taxa_plataforma_centavos, 0);
    NEW.realizada_em := COALESCE(NEW.realizada_em, now());
    NEW.valor_plataforma_centavos := taxa_fixa;
    NEW.valor_profissional_centavos := NEW.valor_consulta_centavos;
    NEW.comissao_percent := 0;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.appointments_on_realizada() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.appointments_on_realizada() TO service_role;