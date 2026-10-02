CREATE OR REPLACE FUNCTION public.professionals_guard_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'private', 'public' AS $function$
BEGIN
  IF auth.role() = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR private.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.email_contato := NULL; NEW.cidade := NULL;
    NEW.foto_status := CASE WHEN NEW.foto_caminho IS NULL THEN 'nao_enviada' ELSE 'pendente' END;
    NEW.foto_moderada_em := NULL; NEW.foto_moderada_por := NULL; NEW.foto_observacao := NULL;
    RETURN NEW;
  END IF;
  NEW.email_contato := OLD.email_contato; NEW.cidade := OLD.cidade;
  NEW.perfil_bloqueios_contato := OLD.perfil_bloqueios_contato;
  NEW.foto_moderada_em := OLD.foto_moderada_em; NEW.foto_moderada_por := OLD.foto_moderada_por;
  NEW.foto_observacao := OLD.foto_observacao;
  IF NEW.foto_caminho IS DISTINCT FROM OLD.foto_caminho THEN
    NEW.foto_status := 'pendente'; NEW.foto_url := NULL;
  ELSE
    NEW.foto_status := OLD.foto_status; NEW.foto_url := OLD.foto_url;
  END IF;
  RETURN NEW;
END;
$function$;
COMMENT ON COLUMN public.professionals.telefone IS 'Private administrative contact for credentialing; never included in public projections or profiles.';