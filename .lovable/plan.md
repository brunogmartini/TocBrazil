# Completar aprovação contratual e trava de publicação

## Objetivo
Ajustar os dois pontos descritos no documento enviado, reutilizando exclusivamente os cinco PDFs já armazenados em `contratos-profissionais/v6.2/`, sem alterar ou reenviar nenhum arquivo.

## O que já existe e será preservado
- Tela de aceite com resumo, PDF original em visualizador, quatro anexos, sete declarações individuais e destaque nas declarações 3 e 7.
- Evidências de leitura e aceite registradas no servidor, com data/hora, IP, localização aproximada, dispositivo e hashes.
- Aceites e leituras contratuais imutáveis.
- Agenda protegida por aceite contratual.
- Perfil público já condicionado a contrato aceito, conta de recebimento ativa e agenda configurada.

## Alterações
1. **Decisão administrativa imutável**
   - Criar uma tabela própria para cada decisão de conferência, sem atualização ou exclusão.
   - Registrar checklist, resultado, motivo, responsável e data/hora em cada nova decisão.
   - Manter revisões como novas linhas de histórico.

2. **Checklist obrigatório no painel da gestão**
   - Adicionar os cinco itens exatos de conferência.
   - Habilitar “Aprovar” somente com todos marcados.
   - Exigir motivo para “Pedir correção” e “Reprovar”.
   - Preservar a abertura privada dos documentos por link de 60 segundos e MFA.

3. **Liberação do contrato protegida no banco**
   - Vincular a disponibilidade do contrato à decisão administrativa mais recente com resultado aprovado, não apenas a uma condição visual.
   - Manter “Documentos em análise” enquanto não houver aprovação válida.

4. **Fluxo de sete etapas**
   - Ajustar o estado mostrado ao psicólogo para distinguir cadastro, documentos, conferência, contrato, agenda e publicação.
   - Após o aceite, enquanto não houver recebimento ativo, mostrar exatamente: “Credenciamento aprovado. Estamos finalizando a integração de pagamentos e avisaremos assim que seu perfil for publicado.”

5. **Trava de publicação**
   - Manter a publicação condicionada simultaneamente a: decisão aprovada, contrato vigente aceito, conta de recebimento ativa e ao menos um horário.
   - Não criar liberação manual alternativa.

## Validação
- Confirmar que os cinco caminhos e hashes permanecem inalterados.
- Testar que profissional sem aprovação não acessa nem aceita o contrato.
- Testar que checklist incompleto não aprova e que correção/reprovação sem motivo falham.
- Testar imutabilidade das decisões e dos aceites.
- Testar que o perfil não aparece sem cada uma das quatro condições.
- Verificar as telas da gestão e do psicólogo em desktop e celular, sem publicar o site.
