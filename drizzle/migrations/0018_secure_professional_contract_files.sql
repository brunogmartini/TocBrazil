CREATE POLICY "administracao le contratos profissionais"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contratos-profissionais' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profissional le contrato ativo"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contratos-profissionais'
  AND EXISTS (
    SELECT 1
    FROM public.contrato_versoes cv
    JOIN public.professionals p ON p.user_id = auth.uid()
    WHERE cv.caminho = storage.objects.name
      AND cv.ativo = true
      AND p.cadastro_conferido_em IS NOT NULL
  )
);