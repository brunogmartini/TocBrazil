# Cadastro consistente, valores a receber e confirmação de consultas

## 1. Mesma situação do perfil em todas as telas
- Corrigir a visão geral e a agenda para consultar o contrato vigente e os dados de repasse conferidos, assim como “Meu cadastro”.
- Usar o mesmo cálculo das etapas em todas essas telas, sem alterar aprovação ou publicação de nenhum profissional.

**Diagnóstico:** a visão geral calcula a etapa sem receber as informações de contrato e repasse. O cadastro do Blabla tem aprovação, aceite registrado, repasse conferido e sete regras de disponibilidade, mas essa leitura incompleta o faz parecer pendente.

## 2. Extrato baseado em pagamentos confirmados
- Remover reservas não pagas, expiradas, canceladas e remarcadas do total e da quantidade de valores futuros.
- Mostrar reservas sem pagamento com sua situação correta, sem contabilizar ganhos.
- Consultas pagas e realizadas entram em “A receber”; “Recebido” só aumenta após um repasse efetivamente registrado, não quando o paciente paga.
- Usar a mesma classificação no financeiro e na visão geral.
- Investigar a falha de processamento da consulta já paga e confirmada, sem executar cobranças, reembolsos ou repasses reais durante os testes.

**Diagnóstico:** existem sete reservas expiradas e não pagas que hoje caem na classificação padrão “Agendada”. A única consulta paga está com presença “Realizada”, mas continua com situação geral “Confirmada” e processamento financeiro “Falhou”. O extrato precisa considerar essas etapas separadamente.

## 3. Confirmação automática e relatos de problemas
- Permitir confirmação explícita depois do término da consulta, até 48 horas após o término previsto.
- Se ambos confirmarem, registrar a realização normalmente.
- Se o paciente ficar em silêncio por 48 horas, considerar realizada **somente se o psicólogo tiver confirmado, o pagamento estiver confirmado e ninguém tiver relatado problema**.
- Sem confirmação do psicólogo, encaminhar para análise da gestão; não concluir automaticamente.
- Acrescentar “A consulta não ocorreu” para paciente e psicólogo, com motivo administrativo obrigatório e aviso para não incluir informações clínicas.
- Manter os relatos privados para os envolvidos e a gestão. Relato de qualquer parte impede a conclusão automática e encaminha a consulta para análise.
- Exibir os dois relatos na análise da gestão, preservando decisão justificada e histórico de evidências.
- Registrar conclusão automática como ação do sistema, sem inventar uma confirmação do paciente.
- Conectar o resultado à fila financeira existente, sem tratar confirmação de presença como prova de repasse já realizado.

## Detalhes técnicos e validação
- Atualizar regras no banco, permissões e funções autenticadas de forma aditiva; manter dados históricos e documentos legais oficiais intactos.
- Reutilizar o processamento existente quando possível; garantir execução após o prazo mesmo sem alguém abrir a página e informar a cadência e eventual atraso do mecanismo escolhido.
- Testar sete reservas não pagas versus uma consulta paga, classificação por presença e repasse, limite de 48 horas, bloqueio por relato, necessidade de confirmação profissional, isolamento de relatos e processamento idempotente.
- Conferir as telas com sessões de paciente e profissional no computador e celular, sem registrar declarações fictícias em consultas reais.

**Entrega:** alterações verificadas na prévia, com resultados e eventuais limitações financeiras informados. Publicação fica para um pedido posterior.