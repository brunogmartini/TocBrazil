# Aceite eletrônico do contrato profissional v6.2

## Objetivo
Inserir o aceite do contrato como etapa obrigatória entre a conferência documental e a agenda, servir os cinco PDFs originais sem qualquer transformação e impedir a publicação enquanto contrato, recebimento e agenda não estiverem prontos.

## Integridade dos documentos
- Subir os cinco PDFs exatamente como recebidos no armazenamento privado `contratos-profissionais`.
- Conferir novamente o SHA-256 após o upload e cadastrar um manifesto versionado com caminho, tipo de anexo, ordem e hash de cada arquivo.
- Preservar as versões escritas nos próprios PDFs, inclusive as diferenças internas entre 6.2 e 6.0; nenhum conteúdo será corrigido, resumido ou regenerado.
- Disponibilizar leitura pública por endereço temporário, sem tornar o repositório público, para que interessados possam consultar o contrato antes do cadastro.

## Fluxo profissional
1. Atualizar a apresentação pública para as sete etapas: conta, cadastro, comprovantes, conferência, aceite, agenda e publicação.
2. Antes da conferência, mostrar “Documentos em análise”. A liberação do aceite será aplicada pela política de acesso do banco, vinculada à conferência registrada pela equipe.
3. Criar uma página de aceite com:
   - card “EM RESUMO” reproduzido literalmente do contrato;
   - visualizador interno do PDF principal original, com registro do fim da rolagem;
   - quatro anexos individuais, com botão “Abrir” e registro imutável de cada acesso;
   - sete declarações literais e individuais, destacando visualmente as declarações 3 e 7;
   - botão habilitado somente após rolagem completa, abertura dos quatro anexos e marcação das sete declarações.
4. Registrar o aceite no servidor com identidade conferida, versão e hashes, horário, IP, agente do navegador, localização aproximada da infraestrutura e hash da evidência. Nenhum desses valores técnicos será aceito do navegador.
5. Manter aceites e registros de leitura imutáveis: sem atualização e sem exclusão para usuários ou gestão.

## Publicação e agenda
- A etapa de publicação exigirá simultaneamente: cadastro conferido, contrato ativo aceito, conta de recebimento Asaas ativa e ao menos um horário configurado.
- Enquanto o recebimento não estiver pronto, mostrar: “Credenciamento aprovado. Estamos finalizando a integração de pagamentos e avisaremos assim que seu perfil for publicado.”
- Não criar liberação manual para contornar a conta de recebimento.
- Bloquear no servidor e nas políticas do banco a configuração da agenda antes do aceite válido.

## Correções relacionadas
- Recolocar, abaixo dos três selos, o texto exato da taxa fixa de R$ 27 e o bloco “Por que existe uma taxa?”.
- Trocar o card contraditório por “Pagamento garantido” e pelo texto exato da reserva 36 horas antes.
- Remover da área profissional todos os pedidos e campos visíveis de apólice de seguro; manter campos históricos do banco apenas como descontinuados.
- Atualizar a área da gestão para separar conferência documental, aceite, conta de recebimento, agenda e publicação.

## Estrutura técnica
- Criar por migração aditiva o manifesto dos cinco arquivos, a tabela `document_acceptances` e o registro imutável de acessos aos anexos, com permissões mínimas, RLS e bloqueio de UPDATE/DELETE.
- Manter as tabelas históricas de contrato sem apagá-las; o novo fluxo passa a usar os registros versionados e imutáveis.
- Usar funções do servidor para emitir endereços temporários, registrar evidências e aceitar o contrato; nenhuma chave privada ou caminho permanente será exposto.
- Registrar em `audit_log` somente tipos de evento e chaves de metadados, sem conteúdo dos documentos ou dados sensíveis.

## Validação
- Rebaixar a conta profissional de teste para o estado anterior ao aceite e verificar que ela vê “Documentos em análise”.
- Conferir que acesso direto e tentativa de aceite antes da aprovação falham no banco.
- Conferir que os checkboxes permanecem bloqueados antes da rolagem e que o aceite falha se faltar anexo ou declaração.
- Aceitar a versão com a conta de teste e comparar os cinco hashes armazenados com os arquivos servidos.
- Verificar que UPDATE e DELETE do aceite falham, que a agenda fica bloqueada antes do aceite e que o perfil continua não publicado sem conta de recebimento ativa.
- Validar a página pública, o fluxo profissional e o painel gestor em desktop e 375 px.

## Dependências e limites
- Os cinco arquivos e hashes já foram recebidos e conferidos localmente; todos coincidem exatamente.
- A publicação continuará bloqueada até a conta de recebimento Asaas estar ativa, conforme solicitado.
- O fluxo não depende da conclusão do pagamento público e não ativará cobranças.
