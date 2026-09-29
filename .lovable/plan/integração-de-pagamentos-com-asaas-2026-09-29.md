# Integração de pagamentos com Asaas

## Objetivo
Substituir o fluxo ativo do Mercado Pago pelo Asaas, começando no sandbox e deixando produção preparada, sem misturar chaves ou endereços entre ambientes. O paciente continua pagando o preço público; o psicólogo recebe o valor líquido e a TOC Brazil recebe a taxa fixa de R$ 27 por split.

## Implementação
- Criar um cliente Asaas exclusivo do servidor, com seleção fechada de ambiente:
  - sandbox: `https://api-sandbox.asaas.com/v3` + `ASAAS_API_KEY_SANDBOX`;
  - produção: `https://api.asaas.com/v3` + `ASAAS_API_KEY_PRODUCTION` somente quando adicionada e ativada;
  - impedir inicialização quando chave e ambiente não correspondem.
- Criar registros privados para subcontas dos psicólogos, clientes Asaas, cobranças A/B e eventos recebidos, com RLS, permissões mínimas e idempotência.
- Criar a subconta Asaas pelo cadastro aprovado do psicólogo e guardar o `walletId`; nunca expor chaves da conta ou do provedor ao navegador.
- Implementar a reserva por cartão conforme o fluxo fornecido:
  - autorização A de R$ 50 (ou o total, se menor), com R$ 10 para a plataforma;
  - autorização B do restante, com R$ 17 para a plataforma;
  - confirmar o horário somente quando todas as autorizações necessárias estiverem autorizadas;
  - cancelar imediatamente uma autorização já criada se a outra falhar.
- Implementar o fechamento idempotente das autorizações conforme o desfecho da consulta, registrando captura/cancelamento no log e notificando a administração em falhas.
- Criar webhook público do Asaas, validar seu token, reconsultar a cobrança no Asaas antes de atualizar o banco e ignorar eventos repetidos.
- Implementar cancelamento e estorno compatíveis com as regras atuais, sem carteira ou repasse manual dentro da TOC Brazil.
- Trocar a área de recebimento do psicólogo para Asaas e atualizar o agendamento/área do paciente com os estados “Reservado”, “Cobrado” e “Reserva liberada”.
- Manter o código antigo do Mercado Pago inativo durante a transição, sem reutilizar suas credenciais.

## Restrição confirmada da API
- A pré-autorização do Asaas é de cartão e expira em cerca de 3 dias. Como o documento manda reduzir o horizonte quando a validade for menor que 30 dias, o agendamento com essa modalidade ficará limitado à janela segura da autorização.
- PIX não oferece pré-autorização. Ele não será apresentado como “reserva sem débito”; sua ativação exige um fluxo contratual separado de cobrança imediata e estorno.

## Validação
- Criar uma subconta de teste no sandbox e conferir o `walletId`.
- Testar autorização A/B, falha parcial com liberação, webhook repetido, captura, cancelamento e estorno.
- Confirmar que nenhuma informação de cartão ou chave Asaas aparece no banco, navegador ou pacote público.
- Testar agendamento e estados financeiros em desktop e celular.

## Dependências externas
- Sandbox será ativado agora com a chave já salva.
- Produção ficará preparada, mas continuará bloqueada até existir `ASAAS_API_KEY_PRODUCTION`, token de webhook de produção e validação final da conta Asaas.
