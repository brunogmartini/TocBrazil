ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_profissao_somente_psicologo
  CHECK (profissao = 'psicologo')
  NOT VALID;

ALTER TABLE public.professionals
  VALIDATE CONSTRAINT professionals_profissao_somente_psicologo;
