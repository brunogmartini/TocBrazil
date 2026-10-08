# Páginas legais, aceites e direitos de privacidade

## Preservação
- Preservar integralmente os Termos e a Política atuais, conforme sua escolha, transferindo-os para versões no banco sem reescrever palavras.
- Preservar os cinco PDFs privados, seus hashes, as sete declarações e a liberação do contrato somente após conferência aprovada.
- Não alterar preços, aprovação, pagamentos nem regras de presença e links das consultas; não publicar automaticamente.

## 1. Documentos públicos e atualização pela gestão
- Criar `/termos-de-uso` e `/termos-profissionais` e adaptar `/privacidade` para carregar o texto vigente do banco, com versão, data e índice de seções.
- Manter `/termos` funcionando como endereço antigo dos Termos.
- Preparar o novo termo profissional com “[COLE AQUI O TEXTO]”, identificado como pendente e indisponível para aceite até receber o texto oficial. Não substituir o contrato PDF por esse texto.
- Acrescentar na gestão a publicação de versões, resumo das mudanças e opção de exigir novo aceite; apenas uma versão vigente por documento.
- Acrescentar os três links e o link de solicitações ao rodapé.

## 2. Aceites de cadastro
- Paciente: duas caixas separadas, obrigatórias e desmarcadas, com os textos exatos fornecidos e links em nova aba.
- Profissional: caixa obrigatória com o texto fornecido e aviso exato no comprovante de CRP. Manter salvamento de campos e uploads; a pendência do texto jurídico não apagará informações preenchidas nem impedirá edição do cadastro existente.
- Registrar identidade, documento, versão, data, hora, IP e navegador no servidor. Registrar também a versão da Política vinculada à concordância, sem substituir a evidência do contrato profissional.
- Preservar a confirmação de e-mail: uma conta ainda sem sessão não poderá gravar aceites passando um identificador de usuário arbitrário; o fluxo deverá vincular a evidência à conta com segurança e concluir a etapa ao confirmar o e-mail, sem aceitar automaticamente por metadados editáveis.

## 3. Reaceite e revogação
- Exibir pedido obrigatório de novo aceite para as versões aplicáveis ao papel do usuário, com resumo das mudanças e link integral.
- Bloquear novas reservas e novas operações de atendimento também no servidor enquanto faltar aceite obrigatório ou houver consentimento revogado; manter consulta ao painel, histórico e pedidos de encerramento acessíveis.
- Não impedir acesso a informações de consultas já existentes nem provocar captura, reembolso ou repasse financeiro.
- Na área do paciente, mostrar aceites e versões e oferecer “Revogar meu consentimento e encerrar minha conta”, com confirmação sobre retenção legal.
- Registrar revogação segura, bloquear novas reservas e encaminhar encerramento para avaliação administrativa; não apagar dados automaticamente.

## 4. Pedidos de privacidade e cookies
- Criar `/privacidade/solicitacoes` com os campos e tipos fornecidos, confirmação de resposta estimada em 15 dias e proteção contra abuso.
- Criar a lista administrativa com filtro de status, ordem do mais antigo para o mais recente e registro da resposta.
- Manter o aviso informativo de cookies essenciais enquanto não houver ferramenta não essencial; permitir reabrir o aviso pelo rodapé, sem apresentar confirmação informativa como consentimento de rastreamento.

## Proteções técnicas
- Criar `legal_documents`, `legal_acceptances` e `privacy_requests` com concessões explícitas e RLS; documentos vigentes públicos, aceites limitados ao titular e à gestão, pedidos acessíveis apenas à gestão.
- Acrescentar `requires_reacceptance` e resumo de mudanças às versões. Preservar versões históricas e impedir alteração do conteúdo que já recebeu aceite.
- Impedir alteração e exclusão de aceites, inclusive por caminhos privilegiados; permitir somente a transição de revogação por função restrita, sem modificar a evidência original.
- Validar papel no servidor, registrar ações administrativas sem copiar mensagens ou informações de saúde para a auditoria e manter dados de IP fora das leituras públicas.

## Verificações e entrega
- Testar permissões entre titular, outro usuário, visitante e gestor, imutabilidade, versão vigente única, reaceite e revogação.
- Testar caixas obrigatórias, confirmação de e-mail, persistência dos registros, solicitações e gestão de status.
- Verificar páginas e formulários em desktop e celular de 375 px, links, índice, contraste e navegação por teclado.
- Entregar relatório indicando exatamente o que passou e o que não pôde ser testado com as contas disponíveis; o texto profissional oficial continua dependendo do seu envio.