DROP POLICY legal_documents_public ON public.legal_documents;
CREATE POLICY legal_documents_public ON public.legal_documents FOR SELECT TO anon,authenticated USING(is_active AND published_at<=now());
CREATE POLICY legal_documents_admin_history ON public.legal_documents FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));