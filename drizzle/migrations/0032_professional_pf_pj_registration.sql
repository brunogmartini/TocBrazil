ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS tipo_pessoa text;
UPDATE public.professionals SET tipo_pessoa = CASE WHEN nullif(trim(cnpj), '') IS NOT NULL THEN 'PJ' ELSE 'PF' END WHERE tipo_pessoa IS NULL;
ALTER TABLE public.professionals ALTER COLUMN tipo_pessoa SET DEFAULT 'PF';
ALTER TABLE public.professionals ADD CONSTRAINT professionals_tipo_pessoa_valid CHECK (tipo_pessoa IN ('PF', 'PJ'));
CREATE UNIQUE INDEX IF NOT EXISTS professionals_cpf_unique ON public.professionals (regexp_replace(cpf, '[^0-9]', '', 'g')) WHERE cpf IS NOT NULL AND trim(cpf) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS professionals_cnpj_unique ON public.professionals (regexp_replace(cnpj, '[^0-9]', '', 'g')) WHERE cnpj IS NOT NULL AND trim(cnpj) <> '';
COMMENT ON COLUMN public.professionals.tipo_pessoa IS 'PF sem CNPJ ou PJ com CNPJ; cadastros anteriores são preservados.';