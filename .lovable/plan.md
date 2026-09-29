# Reforçar a proteção do aceite contratual

## Alterações
- Criar uma trava `BEFORE INSERT` em `document_acceptances` que consulte a última decisão imutável e recuse qualquer cadastro não aprovado, inclusive gravações privilegiadas.
- Alterar a política de inserção para usar a mesma função de decisão mais recente, mantendo `cadastro_conferido_em` apenas como informação de exibição.
- Remover a política permissiva `document_acceptances_server_only`, pois seu `WITH CHECK (false)` é código morto e não restringe as demais políticas.
- Manter a verificação antecipada na função para uma mensagem clara e fazer o aceite gravar como o próprio usuário autenticado, deixando a política valer; manter acesso privilegiado somente onde ele for realmente necessário.

## Verificação
- Confirmar o SQL final da policy, do trigger e das permissões.
- Tentar o aceite de um cadastro não aprovado pela interface, pela função autenticada e por gravação privilegiada direta; os três devem falhar.
- Executar um teste controlado de aceite aprovado ponta a ponta e desfazer os dados temporários, sem alterar os PDFs nem decisões reais.
- Validar compilação e registrar qualquer caminho que não possa ser exercitado com a conta de teste disponível.

## Detalhes técnicos
- A origem única será `private.professional_latest_review_approved(professional_id)`.
- O trigger será a garantia final do banco e continuará ativo mesmo quando RLS for contornada por acesso administrativo.
