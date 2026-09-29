CREATE OR REPLACE FUNCTION public.document_acceptances_require_latest_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.professional_latest_review_approved(NEW.professional_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Aceite contratual permitido somente após aprovação cadastral';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.document_acceptances_require_latest_approval() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.document_acceptances_require_latest_approval() FROM anon;
REVOKE ALL ON FUNCTION public.document_acceptances_require_latest_approval() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.document_acceptances_require_latest_approval() TO service_role;

DROP TRIGGER IF EXISTS document_acceptances_require_latest_approval ON public.document_acceptances;
CREATE TRIGGER document_acceptances_require_latest_approval
BEFORE INSERT ON public.document_acceptances
FOR EACH ROW
EXECUTE FUNCTION public.document_acceptances_require_latest_approval();

DROP POLICY IF EXISTS "approved professional records own document acceptance" ON public.document_acceptances;
CREATE POLICY "approved professional records own document acceptance"
ON public.document_acceptances
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = document_acceptances.professional_id
      AND p.user_id = auth.uid()
  )
  AND private.professional_latest_review_approved(professional_id)
);

DROP POLICY IF EXISTS document_acceptances_server_only ON public.document_acceptances;

GRANT INSERT ON public.document_acceptances TO authenticated;