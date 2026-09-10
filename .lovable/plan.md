# Pagamentos, videochamadas e atualização automática

## Implementação
- Renomear a área financeira do gestor para **Pagamentos aos profissionais**.
- Separar valores a receber do histórico pago, com filtros, datas previstas e totais claros.
- Manter um link exclusivo de videochamada para cada consulta e confirmar seu acesso pelos calendários do paciente e profissional.
- Atualizar agenda e financeiro automaticamente enquanto as telas estiverem abertas e após qualquer alteração de consulta.
- Aplicar comissão de 20% nas novas consultas, deixando 80% líquido para o profissional.
- Preservar os percentuais já registrados em consultas antigas para não reescrever o histórico financeiro.

## Validação
- Testar os painéis de gestor e profissional com as contas existentes.
- Confirmar calendário, detalhe da consulta, link de videochamada e anotações.
- Verificar cálculos, filtros, atualização automática, versão móvel e ausência de erros.

## Detalhes técnicos
- Reutilizar as tabelas e regras existentes de consultas e repasses.
- Usar atualização periódica e invalidação do cache para refletir mudanças sem recarregar a página.
- O link exclusivo continuará usando a sala Jitsi já gerada por consulta, sem integrar um novo serviço neste momento.