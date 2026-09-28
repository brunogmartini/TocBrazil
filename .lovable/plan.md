# Ajustes no cadastro de psicólogos

## O que será alterado

1. **Apresentação pública “Sou psicólogo”**
   - Remover o valor da taxa e os detalhes burocráticos da primeira apresentação.
   - Manter os benefícios, o acesso para quem já tem conta e um caminho inicial mais direto para criar o cadastro.
   - Retirar a apólice da lista de documentos obrigatórios.

2. **Cadastro profissional em duas etapas**
   - Organizar primeiro os dados essenciais e de apresentação.
   - Exibir documentos, dados de recebimento e demais verificações depois que o cadastro inicial for salvo.
   - Exigir CNPJ no cadastro inicial.
   - Trocar o campo de preço para “Quanto você quer receber por consulta? Informe o valor líquido desejado”.
   - Calcular e mostrar ao profissional o preço público como valor líquido informado + R$ 27.
   - Salvar no perfil o preço público, preservando o valor líquido informado separadamente.

3. **Documentos junto aos respectivos dados**
   - CRP: incluir envio da carteirinha profissional junto ao número e à UF.
   - Formação: permitir um comprovante para cada formação declarada.
   - Seguro: tornar todo o bloco opcional, incluindo seguradora, número, validade e anexo.
   - Manter os arquivos privados e disponíveis à equipe somente por endereço temporário.
   - Impedir aprovação sem CNPJ, carteirinha do CRP, diploma/formação e demais documentos obrigatórios; seguro não bloqueará aprovação.

4. **Conclusão e aprovação**
   - Após salvar, mostrar exatamente a situação de cadastro recebida e encerrar o formulário inicial.
   - Quando aprovado, mostrar mensagem de aprovação.
   - Como o contrato definitivo ainda não foi fornecido, mostrar que a assinatura será disponibilizada posteriormente, sem ativar o rascunho existente.

5. **Rodapé e sobreposição**
   - Remover o endereço do rodapé em todo o site, mantendo razão social e CNPJ.
   - Reservar espaço inferior suficiente para a faixa permanente de urgência não ocultar o copyright ou outros conteúdos.

6. **Coerência financeira**
   - Atualizar reserva, pagamento, extratos e textos afetados para a nova regra escolhida: preço ao paciente = valor líquido do psicólogo + taxa fixa de R$ 27.
   - Atualizar os textos jurídicos provisórios apenas onde a regra anterior ficaria contraditória, sem liberar outras promessas ainda não testadas.

## Alterações de dados

- Adicionar ao cadastro profissional: CNPJ, valor líquido desejado, seguradora e número da apólice.
- Preservar as colunas históricas já existentes.
- Manter regras de acesso por usuário e administração, sem tornar documentos públicos.

## Validação

- Testar criação e atualização do cadastro, cálculo do preço, uploads obrigatórios/opcionais, status após envio e aprovação.
- Conferir as páginas pública e autenticada em desktop e 375 px.
- Conferir que o rodapé não fica coberto e que o valor exibido ao paciente é o valor líquido mais R$ 27.
- Não publicar o site; entregar somente a prévia.

## Dependência pendente

- O contrato online continuará inativo até o envio do texto definitivo.
