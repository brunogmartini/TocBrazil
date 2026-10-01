# Corrigir acesso imediato da gestora

## Alteração
- Identificar primeiro o papel da conta diretamente pela sessão autenticada, evitando a falha transitória da chamada intermediária após o login.
- Manter a validação protegida do painel e a autenticação em duas etapas.
- Preservar o comportamento atual para pacientes, profissionais e contas ainda sem papel.

## Verificação
- Entrar com a conta gestora e confirmar que ela segue para a autenticação em duas etapas ou para `/admin`.
- Confirmar que o painel carrega somente com papel de gestão e MFA concluído.
- Conferir a compilação e os erros em execução.
