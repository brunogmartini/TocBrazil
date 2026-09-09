ALTER TYPE public.prof_status ADD VALUE IF NOT EXISTS 'rejeitado';

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS graduacao text,
  ADD COLUMN IF NOT EXISTS instituicao text,
  ADD COLUMN IF NOT EXISTS cursos text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS observacao_admin text,
  ADD COLUMN IF NOT EXISTS validado_em timestamptz,
  ADD COLUMN IF NOT EXISTS validado_por uuid;

CREATE OR REPLACE FUNCTION public.professionals_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.observacao_admin := OLD.observacao_admin;
  NEW.validado_em := OLD.validado_em;
  NEW.validado_por := OLD.validado_por;
  NEW.comissao_percent := OLD.comissao_percent;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professionals_guard_admin ON public.professionals;
CREATE TRIGGER professionals_guard_admin
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.professionals_guard_admin_fields();

CREATE OR REPLACE FUNCTION public.documents_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'enviado';
    NEW.observacao_admin := NULL;
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.observacao_admin := OLD.observacao_admin;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_guard_admin ON public.professional_documents;
CREATE TRIGGER documents_guard_admin
  BEFORE INSERT OR UPDATE ON public.professional_documents
  FOR EACH ROW EXECUTE FUNCTION public.documents_guard_admin_fields();