-- Reviews: expose only safe public columns, never patient or appointment identifiers.
DROP POLICY IF EXISTS avaliacoes_public_select ON public.avaliacoes;
REVOKE SELECT ON public.avaliacoes FROM anon;

CREATE OR REPLACE VIEW public.avaliacoes_publicas
WITH (security_invoker = true)
AS
SELECT id, professional_id, nota, comentario, created_at
FROM public.avaliacoes
WHERE publica = true;

GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;
GRANT ALL ON public.avaliacoes_publicas TO service_role;

CREATE POLICY avaliacoes_public_view_select
ON public.avaliacoes
FOR SELECT
TO anon, authenticated
USING (publica = true);

-- The base table remains inaccessible to anon because its table SELECT grant was revoked;
-- the invoker view grants access only to its explicit safe columns.

-- Platform settings: direct table reads are server-only.
DROP POLICY IF EXISTS settings_public_select ON public.platform_settings;
REVOKE SELECT ON public.platform_settings FROM anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;

-- Professionals: authenticated professionals may update only self-service profile fields.
REVOKE UPDATE ON public.professionals FROM authenticated;
GRANT UPDATE (
  slug,
  nome,
  profissao,
  registro,
  uf,
  foto_url,
  abordagem,
  apresentacao,
  experiencia_toc,
  experiencia_anos,
  formacao,
  especializacoes,
  areas,
  idiomas,
  genero,
  slot_minutos,
  valor_centavos,
  cidade,
  telefone,
  email_contato,
  destaque,
  graduacao,
  instituicao,
  cursos
) ON public.professionals TO authenticated;