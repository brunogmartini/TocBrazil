# Bloco A — Controle de acesso

## Objetivo

Fechar o acesso por padrão e liberar somente os dados necessários para paciente, psicólogo, administrador e visitante anônimo, sem alterar textos ou regras comerciais.

## Implementação

1. **Banco fechado por padrão**
   - Confirmar RLS em todas as tabelas públicas e habilitá-la também na tabela auxiliar privada.
   - Revisar concessões para que tabelas sem política aplicável permaneçam inacessíveis.

2. **Políticas por papel**
   - Manter pacientes limitados ao próprio perfil, consultas, pagamentos, notificações e mensagens.
   - Manter psicólogos limitados ao próprio cadastro, agenda, documentos e consultas vinculadas.
   - Criar uma leitura mínima dos pacientes vinculados para o psicólogo, sem expor o perfil completo.
   - Criar acesso separado ao contato de emergência, somente quando existir consulta confirmada ou realizada entre as partes.
   - Manter administradores com acesso amplo após validação de papel no servidor e registrar cada abertura de dados administrativos.

3. **Exposição pública segura**
   - Remover acesso anônimo direto à tabela completa de profissionais.
   - Criar uma projeção pública somente com as colunas exibidas no site e somente para perfis com status existente `aprovado`.
   - Atualizar as consultas públicas para usar essa projeção.

4. **Funções privilegiadas**
   - Revogar execução pública implícita.
   - Converter para `SECURITY INVOKER` quando não houver necessidade de atravessar RLS.
   - Manter `SECURITY DEFINER` apenas em verificações restritas, rotinas internas, gatilhos e projeções agregadas, com permissões explícitas e `search_path` fixo.

5. **Credenciais e código**
   - Confirmar que a credencial privilegiada permanece apenas no servidor.
   - Substituir leituras privilegiadas usadas pelo painel profissional por funções com escopo do usuário autenticado.

## Testes antes de avançar

Executar em transações isoladas, simulando:

- visitante anônimo tentando ler perfis, pacientes, consultas e contatos de emergência;
- paciente lendo e alterando o próprio perfil e tentando acessar outro paciente;
- psicólogo lendo suas consultas, tentando ler consulta alheia e acessando contato de emergência com e sem vínculo confirmado;
- administrador acessando dados e gerando registro de auditoria;
- chamadas permitidas e negadas de cada função privilegiada.

O relatório mostrará cada cenário, resultado esperado, resultado obtido e qualquer limitação. Nenhum bloco seguinte será iniciado antes dessa apresentação.