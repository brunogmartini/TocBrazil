# Reforço do webhook Asaas

## Objetivo
Adequar o webhook Asaas existente aos requisitos enviados, sem duplicar estruturas e sem expor segredos.

## Implementação
- Manter o endpoint de servidor existente `/api/public/webhooks/asaas`, equivalente seguro para esta arquitetura; não criar uma função paralela.
- Validar `asaas-access-token` com comparação segura antes de ler ou processar o corpo.
- Validar o payload e retornar 401 para token inválido, 400 para corpo inválido e 204 para evento aceito.
- Tornar a idempotência segura também para entregas simultâneas, usando a restrição única já existente na tabela de eventos.
- Reconsultar a cobrança diretamente no Asaas antes de alterar qualquer estado.
- Manter alterações financeiras exclusivamente no servidor e preservar os bloqueios de acesso das tabelas de pagamentos e eventos.
- Registrar somente identificador, tipo, horário, estado e código seguro de falha, sem token ou dados sensíveis.
- Documentar arquivos, segredo já configurado, tabela reutilizada, teste e consulta de registros.

## Validação
- Testar requisição sem token e com token inválido, ambas retornando 401.
- Testar payload inválido após autenticação quando possível sem revelar o segredo.
- Confirmar compilação, ausência do token em código público e bloqueio de escrita para usuários comuns.
