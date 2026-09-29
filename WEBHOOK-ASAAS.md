# Webhook Asaas

## Endpoint

- Sandbox/produção publicada: `https://tocbrazil.com.br/api/public/webhooks/asaas`
- Método: `POST`
- Cabeçalho obrigatório: `asaas-access-token`

O endpoint é uma rota segura do servidor da aplicação. Não foi criada uma Edge Function paralela, pois este projeto processa integrações HTTP externas em rotas de servidor e duplicar o receptor permitiria estados divergentes.

## Segurança

- O cabeçalho é comparado em tempo constante com `ASAAS_WEBHOOK_TOKEN` antes de o corpo ser processado.
- `ASAAS_WEBHOOK_TOKEN` e a chave privada do backend permanecem somente no cofre de segredos; nenhuma variável `VITE_*` é usada.
- A cobrança é reconsultada diretamente no Asaas antes de qualquer atualização.
- Eventos concorrentes com o mesmo identificador são deduplicados pela chave única `(environment, event_id)`.
- `asaas_webhook_events`, `asaas_payment_authorizations` e `asaas_professional_accounts` têm RLS forçada e nenhum privilégio para `anon` ou `authenticated`.
- O registro contém identificador, tipo, horário, estado e falha sanitizada; não contém token, payload integral ou dados do cartão.

## Respostas

- `401`: cabeçalho ausente ou token inválido.
- `400`: JSON ausente ou payload inválido.
- `204`: evento aceito, ignorado com segurança ou já processado.
- `503`: falha temporária ao registrar ou confirmar o evento; o Asaas pode reenviar.

## Teste

Sem token:

```text
curl -i -X POST https://tocbrazil.com.br/api/public/webhooks/asaas \
  -H 'content-type: application/json' \
  --data '{"id":"evt_teste","event":"PAYMENT_UPDATED","payment":{"id":"pay_teste"}}'
```

Resultado esperado: `401`.

O teste autenticado deve ser enviado pelo painel do Asaas Sandbox, configurando o endereço acima e o mesmo token guardado em `ASAAS_WEBHOOK_TOKEN`. Não copie o valor do token para comandos, documentação ou navegador.

## Verificação

No painel gestor, confira o estado do pagamento após o evento. No banco, a tabela `asaas_webhook_events` mostra `event_id`, `event_type`, `received_at`, `processed_at`, `status`, `failure_code` e `error_message`. Os logs do servidor registram apenas o identificador e códigos seguros de falha.