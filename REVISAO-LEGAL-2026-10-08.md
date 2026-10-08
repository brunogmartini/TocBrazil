# Documentos legais e consentimento — 08/10/2026

## Correções concluídas na prévia
- Leitura anônima corrigida: a política pública não chama `has_role`; acesso histórico continua exclusivo da gestão.
- Páginas legais consultam versões do banco, com índice, versão e vigência. Termos e Privacidade v1.4 preservados integralmente.
- Cadastro por e-mail exige checkboxes explícitas e usa comprovante de uso único para evidência server-side; paciente tem consentimento específico separado.
- Modal, histórico e pedidos integrados aos painéis; gestão recebe aba para versões e solicitações.
- Texto profissional placeholder não pode ser aceito. Cadastro profissional novo fica bloqueado até receber o texto oficial; o contrato PDF permanece separado e intacto.
- Bloqueios legais de agendamento e acesso ao link da consulta aplicados no banco. Revogação preserva evidências e marca encerramento para análise, sem exclusão automática.
- Aviso do CRP e links de rodapé adicionados; aviso de cookies essenciais mantido informativo.

## Testes executados
- Compilação automática: `build OK` após as correções.
- Vitest: três testes aprovados (duas escolhas do paciente, aceite profissional e placeholder).
- Playwright: quatro páginas públicas sem erro e sem overflow em 1280px e 375px; botão do paciente só habilitado com ambas as escolhas; profissional bloqueado com placeholder.
- Sessão profissional autorizada: modal aparece, pode continuar apenas no painel e seção de privacidade carrega. Nenhum consentimento foi registrado em nome da responsável.
- API autenticada: consulta de aceites de terceiros sem resultados; funções server-only recusam execução direta com 403; alterações diretas em aceites, versões, encerramentos e pedidos recusadas com 403.
- SQL: policies de leitura próprias/admin, ausência de mutation grants e funções de evidência exclusivas do servidor confirmadas.

## Pendências e limites
- Receber texto oficial do Termo profissional para disponibilizar novos cadastros.
- Não foi concluído teste integral de cadastro novo, consumo do comprovante, reaceite de versão nova e revogação com contas descartáveis, nem envio/atualização de solicitação pela gestão.
- Login Google preservado: a tela de cadastro exige as escolhas; o registro autenticado ocorre pelo modal. Não foi validado o fluxo OAuth completo nem o registro no instante de criação da conta.
- IP só usa cabeçalho de conexão da infraestrutura; na prévia local pode ser nulo. Validar preenchimento e confiança desse cabeçalho no domínio publicado antes de afirmar prova de IP completa.
- Nenhuma publicação realizada; pagamentos públicos permanecem bloqueados.