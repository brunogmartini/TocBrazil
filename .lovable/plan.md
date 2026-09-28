# Segurança alinhada ao Anexo III

## Objetivo
Corrigir as diferenças entre as promessas jurídicas e as proteções efetivas, sem alterar o modelo de negócio nem publicar o site.

## 1. Cabeçalhos e sessão
- Manter `X-Frame-Options: DENY` e `Permissions-Policy` na resposta do servidor, onde funcionam na hospedagem atual.
- Manter a política ampla de conteúdo em modo de relatório enquanto os scripts de inicialização do site não usam nonce; aplicar apenas as diretivas já seguras (`frame-ancestors`, `base-uri`, `object-src`). Não adicionar `unsafe-eval`.
- Testar as páginas públicas e protegidas e registrar os cabeçalhos retornados e violações do console.
- Não criar ou alterar um cookie fictício: o site não usa `session-id`; a sessão atual é gerida no armazenamento seguro da autenticação. Verificar e documentar que `document.cookie` não contém esse nome.

## 2. Controle de acesso e remoção de estrutura clínica
- Criar uma migração de endurecimento que confirme RLS e FORCE RLS nas 29 tabelas atuais, mantendo negação por padrão e permissões mínimas por papel.
- Corrigir apenas permissões/funções realmente excessivas identificadas na auditoria, sem abrir acesso novo.
- Como as tabelas `patient_clinical_records` e `appointment_notes` e o campo `appointments.observacoes` estão vazios, removê-los para que conteúdo clínico não possa ser armazenado futuramente.
- Executar e registrar a consulta que lista tabelas sem RLS.

## 3. Documentos privados
- Manter `documentos-profissionais` privado e sem URL pública.
- Trocar URLs assinadas de credenciamento para validade de 60 segundos.
- Gerar URLs somente em função protegida no servidor, após confirmar gestão com MFA; registrar o acesso no log.
- Restringir a leitura no armazenamento à gestão responsável pela conferência; o profissional mantém apenas o envio e a leitura dos próprios metadados necessários ao cadastro.
- Testar acesso anônimo direto e confirmar a recusa.

## 4. Autenticação
- Elevar a validação de senha do cadastro e da redefinição para 10 caracteres.
- Manter a proteção contra senhas vazadas, já ativada na configuração de autenticação.
- Manter TOTP obrigatório para gestão e adicionar a opção de TOTP na área do psicólogo.
- Generalizar o bloqueio temporário de tentativas repetidas para login por senha, usando identificadores protegidos, sem guardar e-mail ou IP em texto.

## 5. Log de auditoria imutável
- Criar `audit_log` com os campos exigidos, RLS, privilégios mínimos e bloqueio de UPDATE/DELETE.
- Registrar somente metadados para: login/logout, mudança de situação de agendamento, acesso a documento, aprovação/reprovação de cadastro e alteração cadastral.
- Nunca registrar mensagem, sintoma, queixa ou conteúdo clínico; limitar e validar as chaves permitidas em `metadata`.
- Manter o histórico legado existente e usar o novo log para os eventos exigidos daqui em diante.

## 6. Ambientes e chaves
- Verificar o código e o bundle por chaves privadas; manter pagamentos e operações privilegiadas somente no servidor.
- Registrar como pendência externa a segregação: hoje prévia e produção usam a mesma instância do banco. A separação exige provisionar outro ambiente pela infraestrutura, não apenas mudar código.
- Verificar se existem dados reais na instância compartilhada e reportar apenas contagens, nunca dados pessoais.

## 7. Validação e relatório
- Rodar o linter do banco, testes seletivos, build e navegação com console aberto.
- Validar desktop e 375 px nas telas alteradas.
- Criar `RELATORIO-SEGURANCA-ANEXO-III.md` com cada item, local exato alterado, consulta/comando de verificação, resultado e dependências externas.
- Não publicar; entregar a prévia para revisão.

## Dependências externas já identificadas
- Separar desenvolvimento e produção em instâncias distintas da infraestrutura.
- Uma CSP integral com `script-src 'self'` só poderá ser aplicada após suporte a nonce nos scripts de inicialização; até lá, ela continuará em relatório para não derrubar o site.
