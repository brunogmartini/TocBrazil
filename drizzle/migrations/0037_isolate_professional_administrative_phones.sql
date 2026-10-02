CREATE TABLE public.professional_admin_contacts (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  telefone text NOT NULL CHECK (telefone ~ '^[0-9]{10,11}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.professional_admin_contacts TO authenticated;
GRANT ALL ON public.professional_admin_contacts TO service_role;
ALTER TABLE public.professional_admin_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY professional_admin_contacts_owner_select ON public.professional_admin_contacts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY professional_admin_contacts_owner_insert ON public.professional_admin_contacts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));
CREATE POLICY professional_admin_contacts_owner_update ON public.professional_admin_contacts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));
INSERT INTO public.professional_admin_contacts (professional_id, telefone) SELECT id, regexp_replace(telefone, '[^0-9]', '', 'g') FROM public.professionals WHERE length(regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g')) BETWEEN 10 AND 11 ON CONFLICT (professional_id) DO NOTHING;
UPDATE public.professionals SET telefone = NULL WHERE telefone IS NOT NULL;
COMMENT ON COLUMN public.professionals.telefone IS 'DEPRECATED: replaced by professional_admin_contacts.telefone; never expose administrative contacts in public professionals rows.';
CREATE OR REPLACE FUNCTION public.professionals_guard_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'private', 'public' AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.telefone := NULL;
    IF auth.role() = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR private.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
    NEW.email_contato := NULL; NEW.cidade := NULL;
    NEW.foto_status := CASE WHEN NEW.foto_caminho IS NULL THEN 'nao_enviada' ELSE 'pendente' END;
    NEW.foto_moderada_em := NULL; NEW.foto_moderada_por := NULL; NEW.foto_observacao := NULL;
    RETURN NEW;
  END IF;
  NEW.telefone := NULL;
  IF auth.role() = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR private.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
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