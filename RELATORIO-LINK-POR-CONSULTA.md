# Link individual e confirmação de presença

## Implementado
- Links HTTPS por agendamento, com data de atualização e sugestão do perfil acessível somente ao profissional dono.
- Link ausente gera alerta em consultas confirmadas que começam em menos de 24 horas, na visão geral e na agenda.
- Paciente acessa somente seu agendamento, após pagamento aprovado, a partir de 15 minutos antes até duas horas após o fim; a regra é aplicada no banco. O número de minutos é configurável em `platform_settings.antecedencia_link_minutos`.
- Listagens gerais não devolvem `meeting_url`, `link_acesso` ou `video_url`. As concessões de coluna e RPCs protegem o acesso direto.
- Confirmações de paciente e profissional são independentes, imutáveis e disponíveis do início até início + 24 horas. Duas confirmações produzem presença `realizada`, sem mudar o status financeiro.
- Confirmações incompletas passam para `em_analise` ao consultar os painéis; também existe verificação horária independente (24 execuções/dia, atraso máximo aproximado de uma hora quando ninguém abre os painéis).
- Gestor dispõe de lista de análise, resultado, justificativa obrigatória, observação opcional, responsável e horário; decisão final é imutável.
- Cadastro, aprovação, PDFs e bloqueios de pagamento público foram preservados. Não foi criado provedor de vídeo, repasse ou reembolso para esta funcionalidade.

## Testes executados
Data: 08/10/2026. Dados sintéticos, sem cobrança Asaas.

| Teste | Resultado |
|---|---|
| Paciente participante com pagamento aprovado, dentro da janela | RPC retornou link |
| Antes da janela, depois de fim + 2h, pagamento pendente | RPC não retornou link |
| Paciente não participante | RPC não retornou link |
| Anônimo | RPC recusada |
| Leitura direta das três colunas de link | HTTP 403 |
| Listagem de colunas seguras | HTTP 200 |
| Confirmação antes do início / após 24h | Recusada |
| Confirmação de paciente ou profissional não participante | Recusada |
| Primeiro aceite de presença | Gravado |
| Repetição | Timestamp preservado |
| Duas confirmações | Presença realizada; status confirmado e liquidação pendente preservados |
| Alteração direta de timestamp pelo participante | HTTP 403 |
| Consulta vencida sem confirmações | Em análise, sem liquidação |
| Revisão e decisão por não gestor | HTTP 403 |
| Link HTTP, nulo ou editado por outro profissional | Recusado |
| Salvamento de link pelo dono | Gravado e reaberto na interface |
| Botão do profissional dentro da janela | Confirmação gravada pela interface |
| Alerta de link ausente | Exibido na visão geral |
| Desktop 1280px e celular 375px | Modal legível, sem overflow horizontal; screenshots revisados |
| Erros de página na verificação profissional | Nenhum |
| Testes unitários | 6 aprovados |
| Compilação automática | Aprovada |

Os testes de banco do paciente utilizaram a sessão autorizada do solicitante, que era participante das consultas sintéticas; ela também era dona de algumas consultas sintéticas para testar ambos os lados. Nenhuma conta real teve seus papéis alterados.

## Pendências de validação
- A sessão disponível pertence à área profissional: `/painel` redireciona corretamente para `/profissional`. Não foi realizada validação visual autenticada da tela do paciente.
- Não havia sessão gestora autorizada disponível: faltam teste positivo da decisão administrativa e validação visual desktop/mobile dessa tela. O bloqueio de não gestores foi comprovado.
- A agenda da conta disponível estava bloqueada por credenciamento; seus bloqueios não foram removidos. A edição e a confirmação foram verificadas pela visão geral profissional.
- A tarefa horária foi cadastrada; sua execução agendada posterior ainda precisa ser observada. A mudança por consulta ao painel foi comprovada.
- Não houve publicação do frontend. As migrações e a rotina horária foram aplicadas no backend conectado.

## Limpeza
Os dez agendamentos sintéticos identificados pelo prefixo `80000000-0000-4000-8000-` foram removidos ao terminar. Eventos de auditoria imutáveis associados aos testes foram preservados, sem URLs nos metadados.