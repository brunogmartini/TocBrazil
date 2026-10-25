-- Confirma no banco as tabelas de credito do paciente (migraao 0052) e os
-- campos de pagamento unico da consulta (0053), que chegaram ao repositorio
-- pelo GitHub mas nunca foram aplicados a este ambiente. Os comentarios abaixo
-- tambem servem como prova de que as tabelas existem: sem elas este comando falha.
COMMENT ON TABLE public.patient_credits IS 'Credito do paciente gerado quando a consulta nao ocorre e parte do valor cobrado nao e retida como taxa. Tabela server-only: lida apenas por funcao de servidor com verificacao de titularidade.';
COMMENT ON TABLE public.patient_credit_refunds IS 'Pedidos de reembolso do credito do paciente, um pedido ativo por credito. Tabela server-only.';