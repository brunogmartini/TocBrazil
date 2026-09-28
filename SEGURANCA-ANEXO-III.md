# Relatório de segurança — Anexo III, item 7.1

Data da verificação: 28/09/2026

## 1. Cabeçalhos de segurança

**Onde foi alterado:** `src/server.ts`, na função que acrescenta cabeçalhos a todas as respostas, inclusive páginas de erro.

**O que está ativo:** `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=()` e uma CSP aplicada com `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`.

**Limite explícito:** a CSP completa solicitada está em `Content-Security-Policy-Report-Only`. Ela não foi imposta porque a hidratação do site ainda usa scripts inline sem nonce; aplicá-la agora bloquearia o JavaScript do site. Não foi adicionado `unsafe-eval`. O cabeçalho é produzido pela aplicação hospedada na Cloudflare, não por arquivo `_headers`.

**Como verificar:** abra as ferramentas do navegador, guia Rede, selecione a resposta HTML e confira os cabeçalhos. O teste automatizado abriu a home em 1280 px e 375 px, encontrou todos os cabeçalhos acima e nenhum erro no console.

## 2. Cookie de sessão

**O que foi encontrado:** o aplicativo não cria cookie chamado `session-id`. A autenticação existente usa armazenamento local protegido pelo fluxo de autenticação do projeto. Não foi criado um cookie fictício.

**Como verificar:** execute `document.cookie` no console. Nos testes em 1280 px e 375 px, `session-id` não apareceu.

## 3. Controle de acesso por papel

**Onde foi alterado:** `drizzle/migrations/0019_harden_security_audit_and_private_documents.sql`. As estruturas clínicas legadas tiveram acesso de `anon` e `authenticated` revogado e foram marcadas como descontinuadas. Todas as tabelas de `public` e `private` estão com RLS e FORCE RLS.

**Consulta de verificação:**

```sql
select n.nspname as schema_name, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('public', 'private')
  and not c.relrowsecurity;
```

**Resultado em 28/09/2026:** zero linhas. A consulta equivalente para `not c.relforcerowsecurity` também retornou zero linhas nas 29 tabelas.

**Conteúdo clínico encontrado:** existem estruturas legadas `patient_clinical_records`, `appointment_notes` e `appointments.observacoes`. Elas não foram apagadas para preservar o histórico, mas estão descontinuadas e bloqueadas para papéis do aplicativo. As três contagens de conteúdo são zero. O papel técnico interno do servidor continua privilegiado por necessidade operacional e nunca é enviado ao navegador.

**Limite explícito:** não foram criadas quatro contas artificiais nem executada neste trabalho uma matriz cruzada entre dois pacientes e dois psicólogos. Portanto, este relatório comprova RLS/força RLS e políticas, mas não substitui o teste cruzado de identidades previsto em `TESTES-DE-ACESSO.md`.

## 4. Documentos de credenciamento

**Onde foi alterado:** política de armazenamento em `0019_harden_security_audit_and_private_documents.sql`; emissão sob demanda em `src/lib/admin.functions.ts`, função `obterDocumentoCredenciamento`; botão de acesso em `src/routes/_authenticated/admin.tsx`.

**O que mudou:** `documentos-profissionais` permanece privado. A leitura direta é permitida somente à administração autenticada; o psicólogo pode enviar e excluir apenas arquivos da própria pasta. A administração precisa de MFA no nível AAL2, e recebe uma URL assinada válida por 60 segundos. Cada abertura grava `credential_document_accessed` no log.

**Como verificar:** a consulta ao armazenamento retorna `public = false`. Um arquivo real foi solicitado pela URL pública direta, sem sessão, e retornou HTTP 400/`Bucket not found`, sem entregar o conteúdo. A geração autenticada usa uma função de servidor da própria aplicação; nesta arquitetura ela ocupa o papel da edge function solicitada.

## 5. Autenticação

**Onde foi alterado:** validação e tela em `src/routes/auth.tsx`; limitador em `src/lib/auth.functions.ts`; TOTP profissional em `src/routes/_authenticated/profissional.cadastro.tsx`; MFA administrativo já existente no fluxo de gestão.

**O que mudou:** cadastro, entrada e redefinição exigem no mínimo 10 caracteres na interface; proteção contra senhas vazadas está ativa; troca de senha exige a senha atual; TOTP é opcional para psicólogos e exigido nas ações administrativas protegidas; após cinco tentativas de senha em 15 minutos, novas tentativas do mesmo e-mail/IP ficam temporariamente bloqueadas.

**Como verificar:** tente uma senha com nove caracteres; a tela informa o mínimo. Faça cinco tentativas inválidas e a sexta recebe o bloqueio temporário. Em “Meu cadastro profissional”, abra “Segurança da conta” para iniciar TOTP.

**Limite explícito:** a ativação TOTP não foi concluída em uma conta real durante o teste, para não alterar a segurança da conta da responsável. O mínimo de 10 caracteres é garantido pelo aplicativo; a ferramenta disponível de configuração do provedor não expõe um ajuste separado para impor esse mínimo contra chamadas diretas à API.

## 6. Log de auditoria

**Onde foi alterado:** tabela e bloqueio em `0019_harden_security_audit_and_private_documents.sql`; privilégios corrigidos em `0020_restrict_audit_log_privileges.sql`; gravação em `src/lib/audit.server.ts`; chamadas em `auth.functions.ts`, `auth.tsx`, `plataforma.functions.ts`, `profissional.functions.ts` e `admin.functions.ts`.

**O que mudou:** `audit_log` contém os campos pedidos. Usuários comuns não podem inserir, atualizar ou apagar; administradores podem apenas ler; somente o servidor pode inserir. Um gatilho rejeita todo `UPDATE` e `DELETE`, inclusive pelo servidor. Metadados são objetos e uma restrição rejeita chaves/valores associados a mensagem ou conteúdo clínico. São gravados login/logout por senha e OAuth, mudança de situação de consulta, acesso a documento, conferência/publicação/reprovação cadastral e alteração cadastral.

**Como verificar:** a ACL atual é `authenticated=r` e `service_role=ar`; o gatilho `audit_log_block_mutation` está ativo. Tentar `UPDATE` ou `DELETE` resulta em “Registros de auditoria são imutáveis”.

## 7. Segregação de ambientes

**Não concluído.** Prévia e produção usam atualmente o mesmo projeto de dados. A verificação encontrou 6 perfis, 3 profissionais e 1 agendamento nesse ambiente compartilhado; portanto, não é possível afirmar que não há dado real fora de produção.

**Dependência externa:** criar um segundo projeto de dados, migrar apenas estrutura/dados fictícios para desenvolvimento e configurar a prévia para usá-lo. Essa separação não pode ser feita somente dentro deste repositório sem provisionar a nova infraestrutura.

## 8. Chaves no frontend

**Onde foi verificado:** código em `src/` e artefatos gerados. As credenciais privilegiadas aparecem apenas em funções de servidor, rotas de webhook e `src/services/payments.server.ts`, sempre lidas de variáveis de ambiente. O navegador recebe somente a chave publicável prevista pelo serviço.

**Como verificar:** procure por `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_CLIENT_SECRET` nos artefatos do navegador; o teste não encontrou valores de segredo no bundle. Não foi instalada biblioteca de fingerprinting nem analytics de terceiros.

## Verificação geral

- Compilação aprovada após as alterações.
- Home testada em 1280 px e 375 px sem erros no console.
- `/`, `/como-funciona`, `/entenda-o-toc`, `/profissionais`, `/cadastro-profissional`, `/auth`, `/privacidade`, `/termos` e `/cookies` retornaram HTTP 200 sem erros no console.
- O linter do banco ainda aponta cinco funções `SECURITY DEFINER` executáveis por usuários autenticados. Elas verificam `auth.uid()` e implementam acessos funcionais delimitados (pacientes agendados, contato de emergência vinculado, profissionais das próprias consultas, anticontato e conferência de contrato), mas o alerta permanece registrado e não foi ocultado.