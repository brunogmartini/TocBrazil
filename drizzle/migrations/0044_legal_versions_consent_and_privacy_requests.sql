CREATE TABLE public.legal_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL CHECK(slug IN ('termos-de-uso','termos-profissionais','privacidade')), version text NOT NULL CHECK(length(version) BETWEEN 1 AND 40), title text NOT NULL, content_md text NOT NULL, published_at timestamptz NOT NULL DEFAULT now(), is_active boolean NOT NULL DEFAULT false, requires_reacceptance boolean NOT NULL DEFAULT false, change_summary text NOT NULL DEFAULT '', UNIQUE(slug,version)
);
GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_documents_public ON public.legal_documents FOR SELECT TO anon,authenticated USING(is_active OR public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX legal_documents_one_active ON public.legal_documents(slug) WHERE is_active;
CREATE TABLE public.legal_acceptances (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, document_slug text NOT NULL, document_version text NOT NULL, accepted_at timestamptz NOT NULL DEFAULT now(), ip_address inet, user_agent text, kind text NOT NULL CHECK(kind IN ('terms','sensitive_data_consent')), revoked_at timestamptz, FOREIGN KEY(document_slug,document_version) REFERENCES public.legal_documents(slug,version), UNIQUE(user_id,document_slug,document_version,kind)
);
GRANT SELECT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_acceptances_read ON public.legal_acceptances FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.privacy_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, nome text NOT NULL CHECK(length(nome) BETWEEN 2 AND 120), email text NOT NULL CHECK(length(email)<=255), tipo text NOT NULL CHECK(tipo IN ('acesso','correcao','exclusao','portabilidade','revogacao','outro')), mensagem text NOT NULL CHECK(length(mensagem) BETWEEN 3 AND 4000), status text NOT NULL DEFAULT 'aberto' CHECK(status IN ('aberto','em_andamento','concluido')), created_at timestamptz NOT NULL DEFAULT now(), responded_at timestamptz, ip_hash text
);
GRANT SELECT ON public.privacy_requests TO authenticated;
GRANT ALL ON public.privacy_requests TO service_role;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY privacy_requests_admin ON public.privacy_requests FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.legal_signup_receipts (
 token_hash text PRIMARY KEY, email_hash text NOT NULL, area text NOT NULL CHECK(area IN ('paciente','profissional')), documents jsonb NOT NULL, ip_address inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now(), consumed_at timestamptz, ip_hash text NOT NULL
);
GRANT ALL ON public.legal_signup_receipts TO service_role;
ALTER TABLE public.legal_signup_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_signup_receipts_deny ON public.legal_signup_receipts FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
CREATE TABLE public.legal_account_closures (
 user_id uuid PRIMARY KEY, requested_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_account_closures TO authenticated;
GRANT ALL ON public.legal_account_closures TO service_role;
ALTER TABLE public.legal_account_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_closures_read ON public.legal_account_closures FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.legal_acceptance_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Aceites não podem ser excluídos'; END IF;
 IF TG_OP='UPDATE' AND (current_setting('app.legal_revocation',true) IS DISTINCT FROM 'allowed' OR OLD.kind<>'sensitive_data_consent' OR OLD.revoked_at IS NOT NULL OR NEW.revoked_at IS NULL OR (to_jsonb(OLD)-'revoked_at') IS DISTINCT FROM (to_jsonb(NEW)-'revoked_at')) THEN RAISE EXCEPTION 'Evidência de aceite imutável'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER legal_acceptance_immutable BEFORE UPDATE OR DELETE ON public.legal_acceptances FOR EACH ROW EXECUTE FUNCTION public.legal_acceptance_guard();
CREATE FUNCTION public.legal_document_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Versões legais não podem ser excluídas'; END IF;
 IF (to_jsonb(OLD)-'is_active') IS DISTINCT FROM (to_jsonb(NEW)-'is_active') THEN RAISE EXCEPTION 'Publique uma nova versão em vez de alterar o documento'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER legal_document_immutable BEFORE UPDATE OR DELETE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.legal_document_guard();
CREATE FUNCTION public.legal_access_allowed(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.legal_account_closures WHERE user_id=_user_id)
 AND (public.has_role(_user_id,'admin') OR NOT EXISTS (
 SELECT 1 FROM public.legal_documents d WHERE d.is_active AND d.published_at<=now() AND d.content_md NOT LIKE '%[COLE AQUI O TEXTO]%' AND
 (d.slug='privacidade' OR (d.slug='termos-de-uso' AND public.has_role(_user_id,'paciente')) OR (d.slug='termos-profissionais' AND public.has_role(_user_id,'profissional')))
 AND ((NOT EXISTS(SELECT 1 FROM public.legal_acceptances a WHERE a.user_id=_user_id AND a.document_slug=d.slug AND a.kind='terms')) OR (d.requires_reacceptance AND NOT EXISTS(SELECT 1 FROM public.legal_acceptances a WHERE a.user_id=_user_id AND a.document_slug=d.slug AND a.document_version=d.version AND a.kind='terms')))
 )) AND (NOT public.has_role(_user_id,'paciente') OR EXISTS(SELECT 1 FROM public.legal_acceptances a JOIN public.legal_documents d ON d.slug=a.document_slug WHERE a.user_id=_user_id AND a.kind='sensitive_data_consent' AND a.revoked_at IS NULL AND d.is_active AND d.slug='privacidade' AND (NOT d.requires_reacceptance OR a.document_version=d.version)));
$$;
REVOKE ALL ON FUNCTION public.legal_access_allowed(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.legal_access_allowed(uuid) TO authenticated,service_role;
CREATE FUNCTION public.legal_record_acceptances(_documents jsonb,_sensitive boolean,_ip inet,_agent text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.legal_documents; u uuid:=auth.uid();
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 IF EXISTS(SELECT 1 FROM public.legal_account_closures WHERE user_id=u) THEN RAISE EXCEPTION 'Conta em encerramento'; END IF;
 IF _documents IS NULL OR jsonb_typeof(_documents)<>'array' OR jsonb_array_length(_documents)=0 THEN RAISE EXCEPTION 'Informe os documentos'; END IF;
 FOR d IN SELECT * FROM public.legal_documents WHERE is_active AND published_at<=now() AND slug IN (SELECT value->>'slug' FROM jsonb_array_elements(_documents)) LOOP
  IF d.content_md LIKE '%[COLE AQUI O TEXTO]%' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE e->>'slug'=d.slug AND e->>'version'=d.version) THEN RAISE EXCEPTION 'A versão mudou ou ainda não está disponível'; END IF;
  IF (d.slug='termos-de-uso' AND NOT public.has_role(u,'paciente')) OR (d.slug='termos-profissionais' AND NOT public.has_role(u,'profissional')) THEN RAISE EXCEPTION 'Documento não aplicável'; END IF;
  INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(u,d.slug,d.version,'terms',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING;
  IF d.slug='privacidade' AND _sensitive IS TRUE AND public.has_role(u,'paciente') THEN INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent) VALUES(u,d.slug,d.version,'sensitive_data_consent',_ip,left(_agent,1000)) ON CONFLICT DO NOTHING; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_documents) e WHERE NOT EXISTS(SELECT 1 FROM public.legal_documents d WHERE d.is_active AND d.slug=e->>'slug' AND d.version=e->>'version')) THEN RAISE EXCEPTION 'Documento inválido'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.legal_record_acceptances(jsonb,boolean,inet,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.legal_record_acceptances(jsonb,boolean,inet,text) TO service_role;
CREATE FUNCTION public.legal_consume_signup_receipt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.legal_signup_receipts; item jsonb;
BEGIN
 IF NEW.raw_user_meta_data->>'legal_receipt' IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO r FROM public.legal_signup_receipts WHERE token_hash=encode(digest(NEW.raw_user_meta_data->>'legal_receipt','sha256'),'hex') AND email_hash=encode(digest(lower(trim(NEW.email)),'sha256'),'hex') AND consumed_at IS NULL AND created_at>now()-interval '30 minutes' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Aceite de cadastro expirado; tente novamente'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(r.documents) LOOP
  IF NOT EXISTS(SELECT 1 FROM public.legal_documents d WHERE d.is_active AND d.slug=item->>'slug' AND d.version=item->>'version' AND d.content_md NOT LIKE '%[COLE AQUI O TEXTO]%') THEN RAISE EXCEPTION 'A versão legal mudou; tente novamente'; END IF;
  INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent,accepted_at) VALUES(NEW.id,item->>'slug',item->>'version','terms',r.ip_address,r.user_agent,r.created_at) ON CONFLICT DO NOTHING;
  IF item->>'slug'='privacidade' AND r.area='paciente' THEN INSERT INTO public.legal_acceptances(user_id,document_slug,document_version,kind,ip_address,user_agent,accepted_at) VALUES(NEW.id,item->>'slug',item->>'version','sensitive_data_consent',r.ip_address,r.user_agent,r.created_at) ON CONFLICT DO NOTHING; END IF;
 END LOOP;
 UPDATE public.legal_signup_receipts SET consumed_at=now() WHERE token_hash=r.token_hash;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.legal_consume_signup_receipt() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER legal_signup_evidence AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.legal_consume_signup_receipt();
CREATE FUNCTION public.legal_revoke_consent(_ip inet,_agent text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid();
BEGIN
 IF u IS NULL OR NOT public.has_role(u,'paciente') THEN RAISE EXCEPTION 'Acesso restrito ao paciente'; END IF;
 PERFORM set_config('app.legal_revocation','allowed',true);
 UPDATE public.legal_acceptances SET revoked_at=now() WHERE user_id=u AND kind='sensitive_data_consent' AND revoked_at IS NULL;
 PERFORM set_config('app.legal_revocation','',true);
 INSERT INTO public.legal_account_closures(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.privacy_requests WHERE user_id=u AND tipo='revogacao' AND status<>'concluido') THEN
 INSERT INTO public.privacy_requests(user_id,nome,email,tipo,mensagem) SELECT u,coalesce(nullif(nome,''),'Titular'),coalesce(email,''),'revogacao','Revogação de consentimento e pedido de encerramento da conta, sujeito à retenção legal.' FROM public.profiles WHERE id=u;
 END IF;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(u,'paciente','legal_consent_revoked','legal_account_closures',u,'{}');
END $$;
REVOKE ALL ON FUNCTION public.legal_revoke_consent(inet,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.legal_revoke_consent(inet,text) TO service_role;
CREATE FUNCTION public.legal_publish_document(_slug text,_version text,_title text,_content text,_requires boolean,_summary text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id uuid;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito à gestão'; END IF;
 IF _slug NOT IN ('termos-de-uso','termos-profissionais','privacidade') OR length(trim(_content))<30 OR _content LIKE '%[COLE AQUI O TEXTO]%' OR length(trim(_version)) NOT BETWEEN 1 AND 40 OR length(trim(_title)) NOT BETWEEN 3 AND 200 OR length(_content)>200000 OR length(_summary)>4000 OR (_requires AND length(trim(_summary))<3) THEN RAISE EXCEPTION 'Informe texto, versão e resumo válidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('legal:'||_slug));
 UPDATE public.legal_documents SET is_active=false WHERE slug=_slug AND is_active;
 INSERT INTO public.legal_documents(slug,version,title,content_md,is_active,requires_reacceptance,change_summary) VALUES(_slug,_version,_title,_content,true,_requires,_summary) RETURNING id INTO new_id;
 INSERT INTO public.audit_log(actor_id,actor_role,action,entity,entity_id,metadata) VALUES(auth.uid(),'admin','legal_version_published','legal_documents',new_id,'{}');
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.legal_publish_document(text,text,text,text,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.legal_publish_document(text,text,text,text,boolean,text) TO authenticated,service_role;
CREATE FUNCTION public.legal_new_appointment_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE professional_user uuid;
BEGIN
 IF TG_OP='INSERT' OR NEW.inicio IS DISTINCT FROM OLD.inicio OR NEW.professional_id IS DISTINCT FROM OLD.professional_id OR NEW.patient_id IS DISTINCT FROM OLD.patient_id THEN
 SELECT user_id INTO professional_user FROM public.professionals WHERE id=NEW.professional_id;
 IF NOT public.legal_access_allowed(NEW.patient_id) OR (professional_user IS NOT NULL AND NOT public.legal_access_allowed(professional_user)) THEN RAISE EXCEPTION 'Aceite legal ou consentimento pendente: novas consultas bloqueadas'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER legal_new_appointment_check BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.legal_new_appointment_guard();
REVOKE ALL ON FUNCTION public.legal_acceptance_guard(),public.legal_document_guard(),public.legal_new_appointment_guard() FROM PUBLIC,anon,authenticated;