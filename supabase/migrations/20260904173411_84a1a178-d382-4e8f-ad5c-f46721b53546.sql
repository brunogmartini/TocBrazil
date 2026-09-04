CREATE POLICY "docs_prof_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos-profissionais'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin'))
);

CREATE POLICY "docs_prof_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documentos-profissionais'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "docs_prof_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documentos-profissionais'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin'))
);