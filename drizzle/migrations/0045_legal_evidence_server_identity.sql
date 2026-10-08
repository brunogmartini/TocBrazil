CREATE FUNCTION public.legal_record_acceptances_for_user(_user_id uuid,_documents jsonb,_sensitive boolean,_ip inet,_agent text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.legal_documents;
BEGIN
 IF _user_id IS NULL OR EXISTS(SELECT 1 FROM public.legal_account_closures WHERE user_id=_user_id) THEN RAISE EXCEPTION 'Conta indisponível'; END IF;
 IF _documents IS NULL OR jsonb_typeof(_documents)<>'array' OR jsonb_array_length(_documents)=0 THEN RAISE EXCEPTION 'Informe os documentos'; END IF;
 FOR d IN SELECT * FROM public.legal_documents WHERE is_active AND published_at<=now() AND slug IN(SELECT value->>'slug' FROM jsonb_array_elements(_documents)) LOOP
 IF d.content_md LIKE '%[COLE AQUI O TEXTO]%' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE e->>'slug'=d.slug AND e->>'version'=d.version) THEN RAISE EXCEPTION 'Versão indisponível ou alterada'; END IF;
 IF (d.slug='termos-de-uso' AND NOT public.has_role(_user_id,'paciente')) OR (d.slug='termos-profissionais' AND NOT public.has_role(_user_id,'profissional')) THEN RAISE EXCEPTION 'Documento não aplicável'; END IF;
 INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(_user_id,d.slug,d.version,'terms',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING;
 IF d.slug='privacidade' AND _sensitive IS TRUE AND public.has_role(_user_id,'paciente') THEN INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(_user_id,d.slug,d.version,'sensitive_data_consent',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE NOT EXISTS(SELECT 1 FROM public.legal_documents d WHERE d.is_active AND d.slug=e->>'slug' AND d.version=e->>'version')) THEN RAISE EXCEPTION 'Documento inválido'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.legal_record_acceptances_for_user(uuid,jsonb,boolean,inet,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.legal_record_acceptances_for_user(uuid,jsonb,boolean,inet,text) TO service_role;
CREATE FUNCTION public.legal_revoke_consent_for_user(_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF _user_id IS NULL OR NOT public.has_role(_user_id,'paciente') THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
 PERFORM set_config('app.legal_revocation','allowed',true);
 UPDATE public.legal_acceptances SET revoked_at=now() WHERE user_id=_user_id AND kind='sensitive_data_consent' AND revoked_at IS NULL;
 PERFORM set_config('app.legal_revocation','',true);
 INSERT INTO public.legal_account_closures(user_id) VALUES(_user_id) ON CONFLICT DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.privacy_requests WHERE user_id=_user_id AND tipo='revogacao' AND status<>'concluido') THEN
 INSERT INTO public.privacy_requests(user_id,nome,email,tipo,mensagem) SELECT _user_id,coalesce(nullif(nome,''),'Titular'),coalesce(email,''),'revogacao','Revogação de consentimento e pedido de encerramento da conta, sujeito à retenção legal.' FROM public.profiles WHERE id=_user_id;
 END IF;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(_user_id,'paciente','legal_consent_revoked','legal_account_closures',_user_id,'{}');
END $$;
REVOKE ALL ON FUNCTION public.legal_revoke_consent_for_user(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.legal_revoke_consent_for_user(uuid) TO service_role;
COMMENT ON FUNCTION public.legal_record_acceptances(jsonb,boolean,inet,text) IS 'DEPRECATED: use legal_record_acceptances_for_user from authenticated server boundary';
COMMENT ON FUNCTION public.legal_revoke_consent(inet,text) IS 'DEPRECATED: use legal_revoke_consent_for_user from authenticated server boundary';