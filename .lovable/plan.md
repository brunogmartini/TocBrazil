# Aviso de novo cadastro profissional

## Resultado já verificado
- Consultar os registros criados ontem, 30/09/2026, considerando o horário de São Paulo.
- Informar a quantidade encontrada sem expor dados pessoais desnecessários.

## Implementação
- Criar um e-mail transacional destinado exclusivamente a `contatotocbrazil@gmail.com`.
- Disparar o aviso somente após a primeira criação bem-sucedida do cadastro profissional; edições posteriores não enviam novo aviso.
- Usar uma chave única baseada no cadastro para impedir e-mails duplicados em novas tentativas.
- Se o serviço de e-mail estiver temporariamente indisponível, manter o cadastro salvo e registrar apenas a falha técnica no servidor.

## Validação
- Testar o modelo do e-mail e a condição que diferencia criação de edição.
- Conferir a compilação e os registros de erro do site.

## Detalhes técnicos
- O envio reutilizará o serviço transacional já existente, sem colocar chaves ou dados sensíveis no navegador.
- O e-mail conterá nome, CRP/UF e data do cadastro, suficientes para a gestão localizar o registro no painel.
