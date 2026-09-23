# Perfil público do psicólogo e proteções de canal

## Objetivo
Completar o perfil público e os fluxos de continuidade sem alterar preço, taxa fixa, split, responsabilidades clínicas ou regras atuais de pagamento.

## Bloco A — perfil publicável
- Substituir os campos públicos livres por dados estruturados: nome completo, CRP com UF, foto quadrada moderada, até três abordagens, formações com instituição/curso/ano, temas fechados de experiência em TOC, biografia de até 600 caracteres, valor, duração, idiomas e UF.
- Remover cidade e qualquer dado de contato das consultas e telas públicas. Campos históricos de contato permanecerão no banco apenas para compatibilidade, marcados como desativados, sem novas gravações pelo cadastro.
- Criar envio de foto com validação de formato, dimensões mínimas de 600×600 e proporção quadrada; a foto só será pública depois da conferência manual.
- Impedir publicação quando faltar qualquer requisito e aplicar o texto exato no selo de verificação.
- Exibir permanentemente no editor: “Não inclua telefone, e-mail, redes sociais ou links. O contato acontece pela plataforma.”

## Bloco B — proteção antidesvio
- Criar um único detector compartilhado para telefone, sequências numéricas, números por extenso, e-mail, URL/domínio/encurtador, arroba e termos indicados.
- Aplicar validação no navegador e novamente no servidor. Perfil e demais textos livres serão bloqueados, mostrando o tipo e o trecho detectado.
- No chat, bloquear telefone/e-mail/URL/arroba; termos contextuais gerarão aviso cordial com opção explícita de continuar.
- Registrar somente tipo de padrão, agendamento quando houver, profissional e horário; nunca registrar texto detectado ou mensagem.
- Somar tentativas bloqueadas por perfil e criar fila gestora após a terceira ocorrência.
- Exigir aprovação manual da foto, incluindo conferência de texto, telefone, arroba e logotipo.
- Criar testes automatizados com exemplos bloqueados, advertidos e legítimos; apresentar a matriz de resultados no resumo do bloco.

## Bloco C — continuidade com pouco atrito
- Adicionar “Agendar novamente com este psicólogo” no histórico, abrindo diretamente os horários do mesmo profissional.
- Reaproveitar o checkout atual para cartão e PIX; implementar consentimento para cartão salvo e ação de copiar PIX somente onde o provedor devolver esses recursos com segurança.
- Criar recorrência semanal ou quinzenal como intenção: cada sessão terá reserva e confirmação individual, sem pacote ou pré-pagamento.
- Completar remarcação self-service com as mesmas regras de prazo, disponibilidade, reembolso e auditoria do cancelamento.
- Disponibilizar recibo da consulta paga para download, sem conteúdo clínico.
- Manter lembretes de 24 horas e 15 minutos, incluindo o link apenas dentro da janela autorizada.

## Bloco D — continuidade fora da plataforma
- Criar formulário profissional sem texto livre: agendamento, data da manifestação, confirmação obrigatória de iniciativa do paciente e valor configurado.
- Criar cobrança separada da taxa de continuidade e encerrar as restrições somente após confirmação do pagamento.
- Registrar apenas metadados e explicar o mecanismo em linguagem neutra na área profissional.

## Bloco E — indicadores agregados
- Calcular por profissional retorno após primeira consulta, cancelamentos tardios, faltas, detecções e comunicações de continuidade.
- Sinalizar desvios de dois desvios-padrão para cancelamentos e retorno.
- Mostrar somente totais por profissional, sem mensagens, conteúdo, nomes de pacientes ou comportamento individual identificável.

## Bloco F — pesquisa pós-consulta
- Criar pergunta única 24 horas após consulta realizada, com “sim”, “ainda não sei” e “não”.
- Permitir uma resposta por consulta, sem campo livre; manter resultados agregados apenas para gestão.
- Não usar a resposta na busca, ordenação ou perfil e não mostrá-la ao psicólogo.

## Dados e segurança
- Alterações serão aditivas, com permissões explícitas e políticas por papel em cada nova tabela.
- Funções protegidas atuarão como o usuário autenticado; acessos agregados da gestão continuarão exigindo papel gestor e segundo fator.
- Dados de contato de login/recebimento continuam privados e operacionais, mas nunca entram no perfil público ou chat.
- O conteúdo das mensagens não será consultado por nenhuma função ou tela da gestão.

## Validação e entrega
- Executar e resumir A–B primeiro, incluindo a matriz de exemplos do detector.
- Depois executar e resumir C, D, E e F separadamente.
- Testar publicação incompleta, foto pendente, perfil público sem contatos, chat bloqueado/advertido, reagendamento, recorrência, remarcação, recibo, continuidade, métricas e pesquisa.
- Verificar telas móveis e desktop, acessibilidade básica, erros de execução e compilação.

## Limites externos
- Cartão salvo e PIX copiável dependem das capacidades e dados retornados pelo Mercado Pago; não serão simulados como se estivessem disponíveis.
- A meta de três toques será medida no fluxo construído, mas pagamento hospedado pode acrescentar etapas controladas pelo provedor.