CREATE OR REPLACE FUNCTION public.legal_record_acceptances_for_user(_user_id uuid, _documents jsonb, _sensitive boolean, _ip inet, _agent text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE d public.legal_documents;
BEGIN
 IF _user_id IS NULL OR EXISTS(SELECT 1 FROM public.legal_account_closures WHERE user_id=_user_id) THEN RAISE EXCEPTION 'Conta indisponível'; END IF;
 IF _documents IS NULL OR jsonb_typeof(_documents)<>'array' OR jsonb_array_length(_documents)=0 THEN RAISE EXCEPTION 'Informe os documentos'; END IF;
 FOR d IN SELECT * FROM public.legal_documents WHERE is_active AND published_at<=now() AND slug IN(SELECT value->>'slug' FROM jsonb_array_elements(_documents)) LOOP
 IF d.content_md LIKE '%[COLE AQUI O TEXTO]%' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE e->>'slug'=d.slug AND e->>'version'=d.version) THEN RAISE EXCEPTION 'Versão indisponível ou alterada'; END IF;
 IF (d.slug='termos-de-uso' AND NOT private.has_role(_user_id,'paciente')) OR (d.slug='termos-profissionais' AND NOT private.has_role(_user_id,'profissional')) THEN RAISE EXCEPTION 'Documento não aplicável'; END IF;
 INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(_user_id,d.slug,d.version,'terms',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING;
 IF d.slug='privacidade' AND _sensitive IS TRUE AND private.has_role(_user_id,'paciente') THEN INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(_user_id,d.slug,d.version,'sensitive_data_consent',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE NOT EXISTS(SELECT 1 FROM public.legal_documents d WHERE d.is_active AND d.slug=e->>'slug' AND d.version=e->>'version')) THEN RAISE EXCEPTION 'Documento inválido'; END IF;
END $function$;

CREATE OR REPLACE FUNCTION public.legal_revoke_consent_for_user(_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF _user_id IS NULL OR NOT private.has_role(_user_id,'paciente') THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
 PERFORM set_config('app.legal_revocation','allowed',true);
 UPDATE public.legal_acceptances SET revoked_at=now() WHERE user_id=_user_id AND kind='sensitive_data_consent' AND revoked_at IS NULL;
 PERFORM set_config('app.legal_revocation','',true);
 INSERT INTO public.legal_account_closures(user_id) VALUES(_user_id) ON CONFLICT DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.privacy_requests WHERE user_id=_user_id AND tipo='revogacao' AND status<>'concluido') THEN
 INSERT INTO public.privacy_requests(user_id,nome,email,tipo,mensagem) SELECT _user_id,coalesce(nullif(nome,''),'Titular'),coalesce(email,''),'revogacao','Revogação de consentimento e pedido de encerramento da conta, sujeito à retenção legal.' FROM public.profiles WHERE id=_user_id;
 END IF;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(_user_id,'paciente','legal_consent_revoked','legal_account_closures',_user_id,'{}');
END $function$;

CREATE OR REPLACE FUNCTION public.legal_access_allowed(_user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT NOT EXISTS(SELECT 1 FROM public.legal_account_closures WHERE user_id=_user_id)
 AND (private.has_role(_user_id,'admin') OR NOT EXISTS (
 SELECT 1 FROM public.legal_documents d WHERE d.is_active AND d.published_at<=now() AND d.content_md NOT LIKE '%[COLE AQUI O TEXTO]%' AND
 (d.slug='privacidade' OR (d.slug='termos-de-uso' AND private.has_role(_user_id,'paciente')) OR (d.slug='termos-profissionais' AND private.has_role(_user_id,'profissional')))
 AND ((NOT EXISTS(SELECT 1 FROM public.legal_acceptances a WHERE a.user_id=_user_id AND a.document_slug=d.slug AND a.kind='terms')) OR (d.requires_reacceptance AND NOT EXISTS(SELECT 1 FROM public.legal_acceptances a WHERE a.user_id=_user_id AND a.document_slug=d.slug AND a.document_version=d.version AND a.kind='terms')))
 )) AND (NOT private.has_role(_user_id,'paciente') OR EXISTS(SELECT 1 FROM public.legal_acceptances a JOIN public.legal_documents d ON d.slug=a.document_slug WHERE a.user_id=_user_id AND a.kind='sensitive_data_consent' AND a.revoked_at IS NULL AND d.is_active AND d.slug='privacidade' AND (NOT d.requires_reacceptance OR a.document_version=d.version)));
$function$;