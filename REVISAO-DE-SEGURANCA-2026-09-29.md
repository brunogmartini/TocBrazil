# Revisão interna de segurança — 29/09/2026

## Escopo

Revisão técnica interna e automatizada de controle de acesso, armazenamento privado, cabeçalhos HTTP, auditoria, dependências e superfícies públicas. Este documento não equivale a um pentest independente certificado.

## Resultado executivo

- O scanner de segurança da aplicação não encontrou achados nos testes básicos executados.
- O scanner das 59 dependências de produção não encontrou vulnerabilidades conhecidas.
- As 35 tabelas dos esquemas `public` e `private` têm RLS e FORCE RLS ativos.
- As sete tabelas exclusivas do servidor agora também possuem políticas restritivas explícitas que negam clientes anônimos e autenticados.
- Os buckets `documentos-profissionais`, `fotos-profissionais` e `contratos-profissionais` estão privados.
- As tentativas anônimas contra dados pessoais, consultas, documentos, auditoria e estruturas clínicas não retornaram dados.
- O domínio público respondeu com os cabeçalhos de segurança previstos.
- O log de auditoria é imutável, só pode ser gravado pelo servidor e não contém metadados sensíveis na data do teste.

## 1. Controle de acesso e RLS

Consulta estrutural executada sobre as tabelas da aplicação:

- tabelas verificadas: 35;
- sem RLS: 0;
- sem FORCE RLS: 0;
- tabelas com RLS sem política após o reforço: 0.

Foram adicionadas políticas restritivas de negação para:

- `asaas_customers`;
- `asaas_payment_authorizations`;
- `asaas_professional_accounts`;
- `asaas_sandbox_test_runs`;
- `asaas_webhook_events`;
- `tentativas_login_gestor`;
- `private.cron_token`.

Essas estruturas já não concediam acesso aos clientes. A política explícita acrescenta defesa em profundidade para que continuem fechadas caso privilégios sejam modificados no futuro.

### Tentativas anônimas

| Alvo | Resposta | Resultado |
|---|---:|---|
| perfis | 401 | bloqueado |
| agendamentos | 401 | bloqueado |
| auditoria | 401 | bloqueado |
| documentos profissionais | 401 | bloqueado |
| eventos Asaas | 401 | bloqueado |
| registros clínicos legados | 401 | bloqueado |
| anotações clínicas legadas | 401 | bloqueado |

## 2. Armazenamento privado

| Bucket | Público | Limite por arquivo | Acesso público direto |
|---|---|---:|---|
| contratos-profissionais | não | 20 MB | não entregou arquivo |
| documentos-profissionais | não | 10 MB | não entregou arquivo |
| fotos-profissionais | não | 5 MB | não entregou arquivo |

As políticas mantêm os documentos de credenciamento legíveis somente pela administração. O acesso administrativo existente exige MFA e gera URL assinada por 60 segundos. Fotografias permanecem privadas e são servidas pela aplicação por URL temporária.

## 3. Cabeçalhos de segurança

Confirmados em `https://tocbrazil.com.br/` e na resposta local da aplicação:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=()
Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://rdpvmndyoqdljvtuzwfo.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
```

A política mais ampla continua em modo de relatório. Impô-la antes de proteger os scripts internos com nonce interromperia o funcionamento do site.

## 4. Log de auditoria

- leitura: apenas administração autenticada;
- inserção: apenas servidor;
- atualização e exclusão: rejeitadas por gatilho imutável;
- registros existentes no momento do teste: 0;
- registros com chaves de metadados sensíveis: 0.

O teste confirma a estrutura e as restrições. Como ainda não havia eventos gravados, a retenção operacional deve ser reavaliada depois que os primeiros eventos reais forem registrados.

## 5. Testes adicionais

- página inicial: HTTP 200, sem erro de console;
- sete cabeçalhos obrigatórios presentes;
- método TRACE no domínio público: HTTP 405;
- banco e autenticação hospedados: disponíveis e saudáveis;
- erros graves do banco nas últimas 24 horas: nenhum encontrado;
- revisão estática: nenhum uso de `eval`, `new Function` ou escrita direta de HTML encontrado no código da aplicação; o único `dangerouslySetInnerHTML` é do componente interno de estilos de gráfico;
- segredos usados somente em caminhos de servidor; nenhum valor de segredo foi impresso durante os testes.

Métodos PUT, DELETE, PATCH e OPTIONS enviados à raiz retornaram a página pública. Isso não representa escrita de dados, mas o provedor de hospedagem não os rejeita na borda; cada rota de API deve continuar aceitando apenas os métodos definidos por ela.

## 6. Alertas restantes do linter

O linter registra:

1. `pg_net` instalado no esquema público. Não foi movido nesta revisão porque alterar uma extensão de infraestrutura sem janela de manutenção pode afetar tarefas agendadas; não foi encontrado uso dessa extensão no código da aplicação.
2. Cinco funções com privilégios elevados acessíveis a usuários autenticados. Elas são RPCs funcionais usadas pelo site e validam a identidade e o vínculo antes de retornar ou alterar dados. O alerta foi mantido visível e não foi ignorado.

## 7. Limites e próximos passos

- Não foram criadas quatro identidades artificiais para repetir a matriz completa de dois pacientes e dois psicólogos. Essa validação cruzada continua pendente em `TESTES-DE-ACESSO.md`.
- Prévia e produção ainda compartilham a mesma base; a separação depende de infraestrutura externa.
- Antes de habilitar pagamentos públicos, contratar um pentest independente com autorização formal, escopo definido, teste autenticado por papéis e reteste das correções.
- Repetir a revisão após concluir o checkout hospedado do Asaas e antes de ativar pagamentos.