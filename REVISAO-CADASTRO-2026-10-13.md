# Desbloqueio do cadastro profissional

- Causa confirmada: o termo público profissional vigente é um placeholder. A interface desabilitava tanto a caixa quanto o botão.
- Conforme escolha da responsável, novas contas profissionais exigem somente concordância explícita com a Política de Privacidade oficial. O termo profissional continua pendente e não é registrado como aceito.
- A seleção de documentos é compartilhada entre formulário e validação do comprovante no servidor. Versões incorretas, documentos extras e documentos não oficiais continuam recusados.
- Contrato PDF, conferência cadastral, publicação, reaceite e pagamentos não foram alterados.

## Verificações
- Cinco testes unitários passaram, incluindo política profissional obrigatória, placeholder recusado e dois documentos obrigatórios do paciente preservados.
- Caixa profissional clicável; envio desabilitado antes da escolha e habilitado depois.
- Envio real de formulário com conta sintética: conta criada e mensagem de confirmação apresentada.
- Leitura no banco confirmou aceite somente de `privacidade` v1.4 e comprovante consumido. Nenhum aceite do termo pendente ou contrato foi registrado.
- Conta de teste ficou sem confirmação de e-mail e sem perfil profissional público.
- Sem overflow horizontal em 375px. Compilação automática: build OK.
- Entrega de e-mail na caixa de entrada não foi validada; teste não confirmou e-mail nem executou cadastro documental ou contrato.
- Nenhuma publicação realizada; esta correção precisa ser publicada para atingir o site divulgado.