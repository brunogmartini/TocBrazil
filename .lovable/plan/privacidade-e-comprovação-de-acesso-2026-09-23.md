# Privacidade e comprovação de acesso

## Sequência de entrega

1. **Etapa 1 — texto provisório**
   - Trocar na página inicial a promessa atual pela redação provisória fornecida, sem reescrever.
   - Manter intactas as três afirmações já verdadeiras.
   - Acrescentar a frase exata sobre a conexão criptografada.
   - Não publicar ainda textos sobre direitos, exportação ou exclusão.

2. **Etapa 2A — proteção e links**
   - Adicionar os cabeçalhos solicitados, iniciando a política de conteúdo em modo de relatório e preservando os cabeçalhos já corretos.
   - Corrigir o acesso a “Minhas consultas” usando a área autenticada existente e criar `/seus-direitos` sem antecipar funcionalidades incompletas.
   - Auditar e, se necessário, endurecer documentos de credenciamento: armazenamento privado, permissão de conferência e links temporários curtos.
   - Mostrar os cabeçalhos reais da resposta e os testes de acesso a documentos.

3. **Etapa 2B — cookies e portal do titular**
   - Classificar cookies como necessários ou opcionais.
   - Preparar banner condicional, registro versionado de consentimento e preferências acessíveis; sem cookie opcional, o banner ficará oculto.
   - Criar “Meus dados” para consulta, correção, exportação JSON e solicitação de exclusão.
   - Preservar registros fiscais e anonimizar apenas os dados legalmente retidos.
   - Exibir prazo de 15 dias e o e-mail real do encarregado, que depende do dado institucional fornecido.

4. **Etapa 3 — prova de isolamento**
   - Criar duas contas de paciente e duas de psicólogo no ambiente de teste, com agendamentos cruzados.
   - Executar as seis tentativas indicadas; corrigir qualquer acesso indevido e repetir até todas falharem.
   - Registrar cenários, data e resultados em `TESTES-DE-ACESSO.md`, sem incluir dados pessoais, senhas ou tokens.

5. **Etapa 4 — liberação das promessas**
   - Publicar a frase definitiva de acesso segmentado somente após toda a matriz da Etapa 3 passar.
   - Publicar a frase “Você pode ver...” somente após o portal estar funcional e testado.

## Detalhes técnicos

- A política de conteúdo será ajustada a partir dos recursos realmente carregados pelo site; o modo de relatório não será apresentado como proteção aplicada.
- Rotas privadas continuarão sob a proteção de sessão existente, e ações sobre dados terão validação também no servidor.
- Testes verificarão banco, arquivos privados e janela de liberação da sala, não apenas a interface.
- Ao final de cada etapa será informado o que está pronto, o que falhou e o que depende de configuração externa.

## Dependências externas

- E-mail real do encarregado de dados para concluir o texto do portal.
- Eventual destino de relatórios da política de conteúdo, caso seja desejado além da observação local.