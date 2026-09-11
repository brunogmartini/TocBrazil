# Separação segura das áreas e correção dos pagamentos

## Objetivo
Preservar a aplicação atual e corrigir, de forma integrada, o painel do paciente, a área profissional, o acesso do gestor, a regra da taxa de agendamento e as permissões entre os três perfis.

## Alterações

### 1. Proteção de dados e permissões
- Remover a permissão que hoje permite ao profissional ler a linha completa do perfil de pacientes vinculados.
- Manter o paciente com acesso somente ao próprio perfil e o gestor com acesso administrativo já validado no servidor.
- Fazer a ficha profissional buscar, no servidor, somente: primeiro nome, idade/data de nascimento, código interno, informações clínicas, consultas e anotações do vínculo daquele profissional.
- Não retornar e-mail, telefone, endereço, redes sociais ou qualquer contato direto ao profissional, inclusive em chamadas diretas ao servidor.
- Exigir vínculo por consulta autorizada antes de liberar ficha, anotações ou histórico clínico.
- Adicionar validação de papel nas funções do livro, restringindo o benefício a pacientes que não sejam profissionais nem gestores.
- Revisar as funções profissionais para negar operações quando a conta não tiver perfil profissional; manter as funções administrativas protegidas pela validação de gestor já existente.

### 2. Proteção das páginas por perfil
- Criar uma verificação reutilizável de papel para as páginas restritas.
- Bloquear pacientes nas páginas profissionais e profissionais/pacientes no painel do gestor, com redirecionamento seguro para a área correta.
- Preservar o fluxo de novo cadastro profissional, concedendo apenas o papel profissional necessário ao iniciar esse cadastro; a publicação continuará dependente da análise e aprovação existentes.
- Fazer “Minha área” direcionar conforme o papel da sessão, sem misturar os painéis.

### 3. Taxa de agendamento como parte da consulta
- Tratar os R$ 50 como adiantamento/sinal incluído no valor total, nunca como cobrança adicional.
- Exibir de forma consistente: valor total da consulta, taxa já paga ou a pagar agora e saldo restante no atendimento.
- Atualizar agenda, modal de detalhes, próximas consultas, histórico, resumo de agendamento, checkout e textos de confirmação.
- Corrigir os textos financeiros profissionais e administrativos que hoje descrevem a taxa como receita adicional separada, sem alterar o percentual líquido de 80% já configurado.
- Manter compatibilidade com consultas antigas, limitando o saldo restante ao mínimo de zero.

### 4. Painel do paciente
- Colocar calendário e benefício em uma grade comum, com início alinhado e proporções equilibradas em desktop.
- Empilhar os cartões de modo consistente em tablet e celular, preservando bordas, sombras e espaçamento atuais.
- Garantir que o benefício seja renderizado apenas depois da confirmação do papel de paciente.

### 5. Área profissional e contraste
- Corrigir os tokens da área profissional para usar texto escuro sobre superfícies claras.
- Revisar cabeçalhos, navegação, métricas, agenda, financeiro, ficha clínica, cadastro, botões e estados de interação.
- Melhorar o bloco “Já sou profissional cadastrado” com fundo, texto, botão, foco e hover de alto contraste, mantendo a identidade azul/verde e o fundo off-white.

### 6. Acesso do gestor
- Adicionar “Acesso do gestor” discretamente no rodapé.
- Usar a tela de autenticação existente em modo gestor e direcionar contas autorizadas ao painel administrativo.
- Negar no servidor e na navegação qualquer tentativa de acesso administrativo por paciente ou profissional.

## Banco de dados
- Aplicar uma migração para remover a política de leitura ampla de perfis por profissionais.
- Não criar tabelas novas nem alterar os dados administrativos existentes.
- Executar o verificador de segurança após a migração e confirmar que as políticas continuam fechadas para dados não autorizados.

## Validação
- Testar login e destino de paciente, profissional e gestor.
- Testar acesso cruzado às páginas restritas e chamadas protegidas.
- Confirmar que a ficha profissional mostra somente primeiro nome, idade e dados clínicos autorizados.
- Confirmar que e-mail e telefone não aparecem nem são retornados ao profissional.
- Confirmar benefício apenas no painel do paciente.
- Confirmar os três valores do pagamento e saldo correto em agendamento, painel e detalhes.
- Conferir alinhamento do painel do paciente e contraste da área profissional em desktop e celular.
- Verificar compilação, erros de execução e regras de segurança do banco.
