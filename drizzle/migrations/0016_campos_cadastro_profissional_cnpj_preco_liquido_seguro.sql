ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS valor_liquido_centavos integer,
  ADD COLUMN IF NOT EXISTS seguradora_nome text,
  ADD COLUMN IF NOT EXISTS apolice_numero text;

UPDATE public.professionals
SET valor_liquido_centavos = GREATEST(valor_centavos - 2700, 0)
WHERE valor_liquido_centavos IS NULL;

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_cnpj_formato CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$') NOT VALID,
  ADD CONSTRAINT professionals_valor_liquido_nao_negativo CHECK (valor_liquido_centavos IS NULL OR valor_liquido_centavos >= 0) NOT VALID;

COMMENT ON COLUMN public.professionals.cnpj IS 'CNPJ obrigatório para novos cadastros profissionais; somente dígitos.';
COMMENT ON COLUMN public.professionals.valor_liquido_centavos IS 'Valor líquido desejado pelo profissional; o preço público soma a taxa fixa vigente.';
COMMENT ON COLUMN public.professionals.seguradora_nome IS 'Seguradora da apólice opcional de responsabilidade civil profissional.';
COMMENT ON COLUMN public.professionals.apolice_numero IS 'Número da apólice opcional de responsabilidade civil profissional.';