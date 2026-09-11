-- Make the safe-column review view readable without granting access to the underlying identifiers.
DROP VIEW IF EXISTS public.avaliacoes_publicas;
CREATE VIEW public.avaliacoes_publicas
WITH (security_barrier = true)
AS
SELECT id, professional_id, nota, comentario, created_at
FROM public.avaliacoes
WHERE publica = true;
REVOKE ALL ON public.avaliacoes_publicas FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;
GRANT ALL ON public.avaliacoes_publicas TO service_role;

-- Explicitly align table privileges with the intentional no-delete policy.
REVOKE DELETE ON public.appointments FROM anon, authenticated;