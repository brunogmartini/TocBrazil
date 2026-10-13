# Cobrança após conclusão da consulta

## Problema confirmado
- As confirmações e decisões da gestão registram a presença, mas não iniciam a cobrança. Não há tarefa automática ou outro caminho que liquide consultas realizadas ou faltas do paciente.
- Essa separação foi exigida na etapa anterior: presença não deveria capturar, reembolsar ou repassar pagamentos. A correção será uma etapa financeira própria, não a restauração de cobrança por uma única confirmação.
- Os pagamentos públicos continuam bloqueados. A consulta ao banco encontrou **zero agendamentos com autorizações Asaas**, portanto não foi identificado valor reservado de consultas reais aguardando cobrança nesse banco.

## O que implementar
1. Criar processamento financeiro separado para desfechos finais: consulta realizada por duas confirmações ou decisão da gestão; falta do paciente apenas após decisão da gestão; falta do profissional com liberação dos valores conforme as regras existentes. Uma confirmação isolada ou presença em análise nunca cobrará.
2. Aguardar o fim previsto da consulta antes de processar uma realização confirmada. Não alterar a janela de presença, o preço definido pelo psicólogo nem a taxa fixa.
3. Processar as duas autorizações existentes: captura integral de A e B para realização; captura de A e liberação de B para falta do paciente, sem depender de captura parcial ou alteração de split.
4. Registrar o resultado financeiro separadamente da presença. Informar cobrança concluída, pendente ou falha nos detalhes da consulta e na gestão, sem tratar autorização no cartão como dinheiro já recebido.
5. Adicionar recuperação automática de falhas transitórias e encaminhar autorizações expiradas ou divergências para revisão, sem nova cobrança silenciosa.

## Proteções técnicas
- Reforçar o serviço existente antes de reutilizá-lo: aquisição atômica do processamento com retorno verificado, controle por parcela, prazo de processamento e retomada segura após interrupção. O código atual não verifica se ganhou a disputa de processamento.
- Verificar ambiente, titularidade, referência, valores e estado das duas autorizações por reconsulta ao Asaas; não escolher o ambiente de uma autorização apenas pela configuração global.
- Usar fila durável no banco e tarefa autenticada, para não depender de o usuário manter uma página aberta. Aceitar somente desfechos autorizados e bloquear chamadas diretas de pacientes/profissionais à execução financeira.
- Reconciliar os resultados com o provedor antes de marcar execução concluída; não ignorar erros de gravação nem duplicar captura após falha parcial.
- Aplicar concessões explícitas, RLS e auditoria apenas com metadados operacionais, sem copiar justificativas ou informações de saúde.
- Manter o laboratório Sandbox isolado e não processar consultas reais nem ligar pagamentos públicos nesta entrega.

## Testes e limites
- Testar realização, falta do paciente, falta do profissional, confirmação isolada, análise pendente e consulta ainda em andamento.
- Testar duas chamadas concorrentes, repetição, falha entre parcelas, reinício do processamento, erro de gravação e autorização vencida ou de outro ambiente.
- Verificar o ciclo com dados sintéticos no laboratório Sandbox e ler o resultado de volta na interface e no Asaas. Confirmar valores e destinatários sem criar cobrança de paciente real.
- Entregar relatório distinguindo testes locais, Sandbox e condições ainda não validadas para produção. Não publicar automaticamente.

## Fora desta entrega
- Liberar o checkout público ou cobrar consultas antigas automaticamente.
- Alterar documentos oficiais, cadastro, aprovação, regras de presença ou modelo de remuneração.

A implementação desta etapa financeira aguarda aprovação deste plano; a liberação pública continuará dependendo da validação completa do fluxo Asaas.