CREATE OR REPLACE FUNCTION public.professionals_guard_admin_fields() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'private', 'public' AS $function$
BEGIN
  IF auth.role() = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR private.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pendente'; NEW.cadastro_conferido_em := NULL; NEW.cadastro_conferido_por := NULL;
    NEW.validado_em := NULL; NEW.validado_por := NULL; NEW.requer_correcao := false; NEW.observacao_admin := NULL;
    RETURN NEW;
  END IF;
  NEW.status := OLD.status; NEW.observacao_admin := OLD.observacao_admin;
  NEW.validado_em := OLD.validado_em; NEW.validado_por := OLD.validado_por;
  NEW.cadastro_conferido_em := OLD.cadastro_conferido_em; NEW.cadastro_conferido_por := OLD.cadastro_conferido_por;
  NEW.comissao_percent := OLD.comissao_percent; NEW.requer_correcao := OLD.requer_correcao;
  RETURN NEW;
END;
$function$;