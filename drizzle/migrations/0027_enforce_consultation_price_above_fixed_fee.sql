ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_valor_consulta_maior_taxa_fixa
  CHECK (valor_centavos > 2700) NOT VALID;

COMMENT ON COLUMN public.professionals.valor_centavos IS
  'Preço integral da consulta definido pelo profissional e pago pelo paciente; a taxa fixa não é somada a este valor.';

COMMENT ON COLUMN public.professionals.valor_liquido_centavos IS
  'LEGACY/DERIVED: valor do profissional após dedução da taxa fixa; não é campo de formação do preço público.';