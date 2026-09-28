# Aceite eletrônico do contrato profissional

## Objetivo

Deixar o cadastro pronto para receber, posteriormente, um PDF versionado e colher o aceite eletrônico dentro do site ou por um provedor de assinatura. Nenhum contrato será ativado agora, pois o arquivo definitivo ainda não foi enviado.

## O que será construído

1. **Contrato em PDF versionado e privado**
   - Criar um cadastro de versões do contrato, com arquivo, identificador, hash de integridade, data de ativação e modo de assinatura.
   - Guardar cada PDF em área privada, sem endereço público, e liberar visualização temporária somente ao psicólogo correspondente e à administração.
   - Deixar a estrutura pronta para anexar o PDF definitivo depois, sem trocar código.

2. **Aceite eletrônico dentro do site**
   - Exibir o contrato somente após a conferência do cadastro profissional.
   - Exigir leitura/confirmação e aceite expresso do profissional.
   - Registrar de forma imutável: versão e hash do PDF, nome completo, CPF, número e UF do CRP, data e hora, endereço IP, geolocalização aproximada disponível na conexão e identificador protegido do dispositivo.
   - Usar os dados já conferidos no cadastro para impedir que o profissional assine com identidade diferente.
   - Mostrar exatamente o texto jurídico fornecido junto ao aceite.

3. **Compatibilidade com provedor de assinatura**
   - Preparar o registro para guardar provedor, identificador externo, estado da assinatura e comprovante de integridade.
   - O aceite interno não afirmará que houve conferência por provedor; a menção ao art. 784, § 4º, será vinculada ao fluxo externo quando ele estiver efetivamente conectado.
   - A escolha e conexão do provedor poderão ser feitas depois, sem perder os aceites ou versões existentes.

4. **Proteção da publicação**
   - Separar cadastro conferido de perfil publicado.
   - Impedir nova publicação sem aceite válido da versão ativa do contrato.
   - Manter os cadastros recebidos como pendentes enquanto não houver PDF ativo e assinatura.

5. **Área do psicólogo e administração**
   - Substituir o aviso atual por estados claros: contrato ainda não disponível, disponível para leitura, assinatura registrada ou assinatura externa pendente.
   - Permitir à administração acompanhar versão, data, modo e situação da assinatura, sem permitir alteração do registro aceito.

## Dados e segurança

- Criar as alterações de dados com permissões mínimas e bloqueio de alteração/exclusão do aceite.
- Não armazenar coordenadas precisas; usar apenas localização aproximada fornecida pela infraestrutura quando disponível.
- Gerar o identificador do dispositivo como hash específico do aceite, sem criar rastreamento permanente.
- Tratar IP e evidências como dados restritos ao profissional e à administração.

## Validação

- Testar que um usuário não acessa contrato ou aceite de outro profissional.
- Testar que identidade divergente, contrato inativo, versão já aceita e cadastro não conferido são recusados.
- Testar que não é possível publicar sem assinatura da versão ativa.
- Conferir a área do psicólogo e a administração em desktop e 375 px.
- Não publicar o site; entregar somente a prévia.

## Dependências posteriores

- O PDF definitivo e sua identificação de versão.
- A escolha do provedor externo, suas credenciais e o modelo de integração, caso o fluxo certificado seja ativado.
