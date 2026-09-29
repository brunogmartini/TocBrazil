# Laboratório administrativo Asaas Sandbox

## Objetivo
Adicionar ao painel do gestor um fluxo isolado para validar subcontas, split, captura e cancelamento no Asaas Sandbox, sem liberar pagamentos para pacientes nem alterar agendamentos reais.

## Implementação
- Criar uma área “Testes Asaas” no painel do gestor, identificada permanentemente como Sandbox.
- Exigir login administrativo com autenticação em duas etapas em todas as ações.
- Criar subcontas de teste a partir de dados fictícios informados pelo gestor e mostrar o `walletId` retornado.
- Permitir criar um cliente de teste e duas pré-autorizações A/B com cartão de teste:
  - A: R$ 50, com split fixo de R$ 10 para a plataforma;
  - B: restante, com split fixo de R$ 17 para a plataforma.
- Não armazenar número, validade ou código de segurança do cartão; enviar os dados somente ao Asaas durante a ação.
- Disponibilizar ações separadas para atualizar estado, capturar e cancelar cada autorização.
- Registrar no banco apenas identificadores, valores, estados, horários e códigos seguros de falha, em histórico privado e imutável para usuários comuns.
- Manter `pagamentosAtivos: false`; o laboratório não reutiliza reservas, pacientes ou consultas reais.
- Exibir resultados claros por etapa: subconta criada, split enviado, autorização, captura, cancelamento e falha.

## Validação
- Confirmar que somente gestor com MFA acessa e executa o laboratório.
- Confirmar que as chamadas usam exclusivamente a URL e a chave do Sandbox.
- Executar um ciclo completo com dados e cartão de teste: subconta, A/B, captura e cancelamento.
- Verificar que nenhum dado de cartão aparece no banco, nos logs, nas respostas ou no pacote público.
- Validar o painel em desktop e 375 px.

## Dependência externa
- O teste completo depende de dados fictícios aceitos pelo Asaas Sandbox e de um cartão de teste válido fornecido pela documentação do Asaas; nenhum dado real será usado.
