CREATE OR REPLACE FUNCTION public.legal_record_acceptances_for_user(_user_id uuid, _documents jsonb, _sensitive boolean, _ip inet, _agent text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE d public.legal_documents;
BEGIN
 IF _user_id IS NULL OR EXISTS(SELECT 1 FROM public.legal_account_closures WHERE user_id=_user_id) THEN RAISE EXCEPTION 'Conta indisponível'; END IF;
 IF _documents IS NULL OR jsonb_typeof(_documents)<>'array' OR jsonb_array_length(_documents)=0 THEN RAISE EXCEPTION 'Informe os documentos'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE NOT EXISTS(SELECT 1 FROM public.legal_documents ld WHERE ld.is_active AND ld.slug=e->>'slug' AND ld.version=e->>'version')) THEN RAISE EXCEPTION 'Documento inválido'; END IF;
 FOR d IN SELECT * FROM public.legal_documents WHERE is_active AND published_at<=now() AND slug IN(SELECT value->>'slug' FROM jsonb_array_elements(_documents)) LOOP
 IF d.content_md LIKE '%[COLE AQUI O TEXTO]%' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE e->>'slug'=d.slug AND e->>'version'=d.version) THEN RAISE EXCEPTION 'Versão indisponível ou alterada'; END IF;
 IF (d.slug='termos-de-uso' AND NOT private.has_role(_user_id,'paciente')) OR (d.slug='termos-profissionais' AND NOT private.has_role(_user_id,'profissional')) THEN RAISE EXCEPTION 'Documento não aplicável'; END IF;
 INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(_user_id,d.slug,d.version,'terms',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING;
 IF d.slug='privacidade' AND _sensitive IS TRUE AND private.has_role(_user_id,'paciente') THEN INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(_user_id,d.slug,d.version,'sensitive_data_consent',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING; END IF;
 END LOOP;
END $function$;