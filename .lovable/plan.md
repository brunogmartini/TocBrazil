# Correções pontuais e conformidade — TOC Brazil

## Ordem de execução

### Blocos 1–3: base institucional e textos
- Centralizar razão social, CNPJ, endereço, e-mail, horário de atendimento e estado dos pagamentos em uma configuração única, mantendo marcadores visíveis para dados ainda não fornecidos.
- Exibir os dados institucionais no rodapé e completar `/suporte` com o canal eletrônico, horário e prazo de resposta.
- Bloquear o início de qualquer pagamento enquanto a configuração estiver desativada e refletir isso nas telas.
- Aplicar somente as substituições jurídicas solicitadas e as quatro correções encontradas na revisão textual.
- Validar páginas públicas e resumir separadamente cada bloco.

### Blocos 4–6: busca, mobile e entrada profissional
- Criar o estado vazio inicial da busca sem filtros, com cadastro de aviso por e-mail e consentimento registrado; diferenciar o estado de filtros sem resultados.
- Trocar a ação fixa mobile por “Ver psicólogos disponíveis” e garantir que ela não cubra o aviso de urgência em 375 px.
- Consolidar os acessos profissionais no menu e rodapé em “Sou psicólogo” e “Entrar”.
- Completar a página profissional com o link de repasse e informações de liquidação/retenção disponíveis no provedor.

### Blocos 7–9: administração, filtros e chamadas
- Remover a divulgação do acesso gestor no rodapé.
- Exigir segundo fator e papel de gestor no servidor para funções administrativas; limitar tentativas do login de gestão.
- Mostrar três filtros principais, combinar dia/turno em disponibilidade e colocar idioma/gênero em “Mais filtros”.
- Variar as chamadas da home mantendo `/profissionais` como destino.

## Dados e segurança
- O cadastro de aviso terá tabela própria, consentimento datado, acesso público apenas para inclusão e leitura restrita à gestão.
- Novas tabelas terão permissões explícitas e políticas de acesso.
- O papel de gestor continuará verificado no servidor; esconder links não será tratado como controle de acesso.

## Validação
- Conferir o estado real do banco e as regras de pagamento/administração.
- Testar home, busca, suporte, página profissional, login gestor e visual mobile em 375 px.
- Verificar erros de compilação, execução e console.
- Entregar relatório por bloco, dados pendentes e limitações.
