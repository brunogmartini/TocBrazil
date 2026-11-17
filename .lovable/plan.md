# Registrar repasses pagos ao psicólogo

O financeiro do psicólogo só mostra "Recebido" quando o repasse está marcado como pago, mas hoje ninguém consegue marcar isso. Como o repasse é manual, falta essa ação para a gestão.

## O que muda
- No painel de gestão, cada consulta realizada e paga mostra o repasse pendente com o botão "Marcar repasse como pago" (data e observação opcional).
- Ao marcar, o psicólogo passa a ver o valor em "Recebido" e no filtro "Pagas".
- A ação fica registrada no histórico de auditoria; só administradores podem usá-la.

## Detalhes técnicos
- Função server-side com verificação de papel admin via RLS, atualizando `payouts.status='pago'`, `pago_em`, `pago_por`, `observacao`; registro em `audit_log` só com nomes de campos.
- Teste: repasse marcado aparece como "pago" em `financialSituation`; não-admin é recusado.
