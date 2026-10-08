# Link por consulta e confirmação de atendimento

## O que será ajustado
- Cada agendamento terá seu próprio link HTTPS, editável pelo psicólogo. O endereço do perfil servirá apenas como sugestão; não será liberado automaticamente ao paciente.
- Exibir o aviso de responsabilidade exatamente como solicitado e alertar sobre consultas nas próximas 24 horas sem link informado.
- Liberar o link somente ao paciente daquela consulta, com pagamento confirmado, desde 15 minutos antes do início até duas horas depois do término. Fora desse intervalo, nenhum endereço será enviado ao paciente, inclusive por acesso direto ao banco.
- Registrar separadamente as confirmações do paciente e do psicólogo, do início até 24 horas depois do início, com datas imutáveis. Duas confirmações resultarão em atendimento realizado; confirmações incompletas após o prazo resultarão em análise.
- Acrescentar à gestão uma lista de atendimentos em análise, com as confirmações, observação administrativa opcional e decisão final com justificativa obrigatória, responsável e data.
- Preservar cadastro, aprovação, documentos e pagamentos. Não criar sala própria, reembolso nem repasse; não publicar nesta etapa.

## Compatibilidade com o fluxo atual
Hoje a confirmação de uma única parte chama a liquidação financeira, e a rotina antiga conclui consultas automaticamente. O novo acompanhamento de presença será separado desses efeitos: seus botões e decisões registrarão apenas a presença, sem captura, repasse ou reembolso. A rotina de vencimento desse acompanhamento encaminhará divergências à gestão em vez de confirmar realização automaticamente. Cancelamentos e os demais caminhos de pagamento permanecerão como estão.

## Validação
- Testar links distintos, HTTPS inválido, alerta de link ausente e limites exatos das janelas de 15 minutos, duas horas e 24 horas.
- Testar acesso anônimo, paciente titular, outro paciente, psicólogo titular, outro psicólogo e gestor, incluindo chamadas diretas ao banco e tentativas de contornar a proteção pelos campos antigos.
- Testar confirmação de cada parte, confirmação dupla, repetição sem alteração de data, vencimento e decisão administrativa com justificativa.
- Confirmar que ações de presença não acionam pagamentos e que links não escapam por listagens, calendário ou e-mails.
- Verificar computador e celular e relatar os casos realmente executados, separando qualquer impedimento externo.

## Detalhes técnicos
- Migração aditiva em appointments para meeting_url, meeting_url_updated_at, professional_confirmed_at, patient_confirmed_at e attendance_status, mais metadados de decisão administrativa.
- Restringir leitura dos campos de link, inclusive os legados, e disponibilizá-los somente por operações autenticadas que verificam titularidade e horário no banco. Preservar os registros históricos, sem apagar colunas.
- Operações de confirmação e decisão serão atômicas, com validação e proteção de imutabilidade no banco. attendance_status não alterará status financeiro nem acionará liquidação.
- Reutilizar os painéis e a atualização automática existentes; acrescentar testes pequenos para cada regra de acesso, prazo e confirmação.
