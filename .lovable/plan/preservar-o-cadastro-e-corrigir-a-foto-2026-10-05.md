# Preservar o cadastro e corrigir a foto

## Objetivo
Evitar que informações já preenchidas desapareçam durante o cadastro e fazer a foto do perfil ser anexada e registrada imediatamente.

## Alterações
- Manter os valores digitados no formulário quando a página atualiza após o envio de documentos ou da foto.
- Continuar carregando do banco todos os campos já salvos quando o profissional retorna ao cadastro.
- Criar uma gravação específica da foto, vinculada à conta autenticada, sem depender de salvar novamente todo o formulário.
- Após o envio, mostrar a foto temporariamente e atualizar sua situação para análise; remover o arquivo novo se a gravação falhar.
- Preservar a foto anterior até a nova estar registrada e remover somente substituições próprias que ficaram obsoletas.

## Segurança
- Manter o bucket privado e o caminho limitado à pasta da própria conta.
- Não ampliar acesso público às fotos; a publicação continua condicionada à conferência manual.
- Não guardar CPF, telefone ou outros dados pessoais em armazenamento local do navegador.

## Validação
- Testar que enviar documento ou foto não apaga campos ainda digitados.
- Testar upload JPG/PNG/WebP válido, visualização e persistência após recarregar.
- Testar rejeição de formato, dimensão e tamanho inválidos.
- Conferir em computador e celular, sem publicar o site.
