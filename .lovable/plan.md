# Corrigir o valor da consulta conforme o contrato

## O que será alterado

1. **Cadastro profissional**
   - Trocar o campo para “Valor da sua consulta”.
   - Mostrar o apoio exato: “Este é o valor que o paciente vê e paga. Você define livremente.”
   - Mostrar abaixo quanto o profissional recebe: valor digitado menos R$ 27.
   - Exigir valor maior que R$ 27, com a mensagem solicitada, tanto na tela quanto no servidor.

2. **Regra financeira**
   - Salvar o valor digitado como preço público integral, sem soma, arredondamento adicional ou ajuste comercial.
   - Calcular o valor do profissional como preço da consulta menos a taxa fixa de R$ 27.
   - Manter os registros históricos de consultas com os valores congelados no momento do agendamento.
   - Manter pagamentos públicos bloqueados enquanto o fluxo Asaas não estiver validado.

3. **Textos e telas relacionadas**
   - Corrigir a área financeira, resumo profissional, detalhes de consulta, painel administrativo e página para psicólogos.
   - Remover afirmações de que a taxa está incluída ou somada ao preço público.
   - Manter as colunas “Valor da consulta” e “Valor do profissional”.

4. **Dados já cadastrados**
   - Não converter nem atualizar automaticamente nenhum cadastro existente.
   - Há quatro cadastros com preço salvo para decisão individual: João da SIlva (R$ 50,00), Dra. Profissional Teste (R$ 50,00), Psicologa Natalia (R$ 200,00) e Psicóloga Teste Isolada (R$ 127,00).
   - Ao editar, o campo exibirá o preço público atualmente salvo; nenhuma alteração ocorrerá apenas por abrir a página.

## Proteção dos dados

- Adicionar uma validação no banco para novos valores, sem modificar os registros atuais.
- Preservar a coluna histórica de valor líquido, mas passar a tratá-la como derivada do preço público menos R$ 27.
- Registrar a mudança de regra técnica no documento de decisões do projeto.

## Validação

- Testar valor igual a R$ 27,00 e confirmar a rejeição com a mensagem exata.
- Testar valor de R$ 180,00 e confirmar: paciente vê/paga R$ 180,00; profissional recebe R$ 153,00; taxa R$ 27,00.
- Conferir cadastro e financeiro em desktop e 375 px.
- Verificar que os quatro cadastros existentes não foram alterados.
- Não publicar o site; entregar somente a prévia.
