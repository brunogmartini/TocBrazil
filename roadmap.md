- [x] Bloco A — Controle de acesso no banco
  - [x] Inventariar tabelas, políticas, funções privilegiadas e credenciais
  - [x] Aplicar políticas mínimas e projeções públicas seguras
  - [x] Remover leituras privilegiadas desnecessárias do fluxo profissional
  - [x] Registrar acessos administrativos
  - [x] Testar anonimato, isolamento entre pacientes, acesso profissional e administração
  - [x] Apresentar políticas e resultados antes de continuar
- [ ] Blocos B–Q — aguardando revisão e autorização após o relatório do bloco A

## Correções pontuais e conformidade — 23/09/2026
- [x] Blocos 1–3: institucional, pagamentos desativados e revisão textual
- [x] Blocos 4–6: estados da busca, mobile e portas profissionais
- [x] Blocos 7–9: administração, filtros e chamadas de ação
- [x] Validação final e relatório por bloco

## Perfil público e proteções de canal — 23/09/2026
- [x] Blocos A–B: perfil publicável, antidesvio, auditoria e moderação de foto
- [x] Bloco C: reagendamento, recorrência, remarcação, recibo e lembretes
- [x] Bloco D: comunicação e cobrança de continuidade fora da plataforma
- [x] Bloco E: indicadores agregados e alertas estatísticos
- [x] Bloco F: pesquisa pós-consulta agregada
- [x] Validação final por bloco, segurança, acessibilidade e mobile

## Privacidade e comprovação de acesso — 23/09/2026
- [x] Etapa 1: publicar somente o texto provisório verdadeiro e a informação de conexão criptografada
- [ ] Etapa 2A: cabeçalhos de segurança, links do rodapé e confirmação do armazenamento privado
- [ ] Etapa 2B: consentimento de cookies desativado por padrão e portal “Meus dados”
- [ ] Etapa 3: executar a matriz de isolamento e registrar TESTES-DE-ACESSO.md com data
- [ ] Etapa 4: liberar cada texto definitivo somente após seu teste correspondente passar

## Correções legais e de segurança — 27/09/2026
- [x] Atualizar identificação e contato no rodapé e em todo o site
- [x] Substituir as páginas resumidas por textos baseados nos anexos, em versão provisória sem promessas não verificadas
- [ ] Liberar os textos definitivos integrais somente após testar pagamentos, consentimento, direitos, cookies e prazos declarados
- [ ] Corrigir afirmações e documentos na página profissional e base legal na privacidade (texto do consentimento destacado aguarda fluxo separado verificável; demais correções feitas)
- [x] Aplicar e verificar cabeçalhos de segurança e investigar cookie de sessão (proteção contra iframe ativa; CSP ampla em relatório até ajustar scripts inline; cookie session-id não é emitido pelo app)
- [x] Exibir aviso informativo de cookies essenciais

## Ajustes no cadastro de psicólogos — 28/09/2026
- [x] Simplificar a apresentação pública e remover taxa/documentos da primeira etapa
- [x] Exigir CNPJ e salvar valor líquido com preço público acrescido de R$ 27
- [x] Posicionar uploads de CRP, formação e seguro opcional junto aos respectivos campos
- [x] Encerrar o cadastro inicial com a situação de análise e manter contrato aguardando texto final
- [x] Remover endereço do rodapé e corrigir sobreposição da faixa de urgência
- [x] Atualizar cálculos e textos afetados pela nova composição do preço
- [ ] Validar desktop, 375 px, documentos privados e cálculo financeiro

## Aceite eletrônico do contrato — 28/09/2026
- [x] Criar versões privadas de PDF e registros imutáveis de aceite
- [x] Registrar identidade, CRP, data/hora, IP, localização aproximada e identificador protegido do dispositivo
- [x] Preparar os modos de assinatura interna e por provedor externo
- [x] Separar conferência cadastral de publicação e exigir contrato ativo aceito
- [ ] Anexar e ativar o PDF definitivo fornecido pela responsável
- [ ] Conectar o provedor externo escolhido e validar seu comprovante de integridade

## Segurança — Anexo III — 28/09/2026
- [x] Reforçar RLS nas 29 tabelas e bloquear estruturas clínicas legadas
- [x] Restringir documentos de credenciamento e emitir URL assinada de 60 segundos sob demanda
- [x] Criar log de auditoria imutável e conectar eventos operacionais exigidos
- [x] Elevar senha para 10 caracteres e ampliar bloqueio temporário a todos os logins por senha
- [x] Adicionar TOTP opcional na área do psicólogo
- [x] Validar cabeçalhos, cookies, bundle, desktop e 375 px; emitir relatório final
- [ ] Separar banco de prévia e produção (depende de infraestrutura externa)

## Pagamentos Asaas — 29/09/2026
- [x] Criar estrutura privada para subcontas, clientes, autorizações A/B e webhooks
- [x] Isolar sandbox e produção por chave e endereço da API
- [x] Conectar formulário de reserva no cartão e estados do paciente
- [x] Conectar estado de recebimento do psicólogo; criação fica sob ação administrativa após conferência KYC
- [x] Conectar captura/cancelamento aos desfechos da consulta
- [ ] Validar no sandbox autorização A/B, cancelamento imediato, split e webhook
- [x] Criar laboratório administrativo isolado para subconta, split, captura e cancelamento no Sandbox
- [ ] Executar ciclo financeiro completo no laboratório com dados e cartão oficiais de teste do Asaas
- [x] Reforçar webhook Asaas com token, validação, deduplicação atômica e registro seguro

## Documentos oficiais e fluxo seguro de cartão — 29/09/2026
- [x] Publicar integralmente Termos de Uso e Política de Privacidade oficiais v1.3
- [x] Corrigir as três frases divergentes na home e no formulário de cartão
- [x] Reemitir `session-id` como HttpOnly, Secure e SameSite=Lax quando presente
- [ ] Substituir a coleta direta de cartão por fluxo oficial do Asaas sem trânsito de PAN/CCV pelo servidor da TOC Brazil

## Revisão e reforço de segurança — 29/09/2026
- [x] Confirmar RLS e FORCE RLS nas 35 tabelas dos esquemas da aplicação
- [x] Adicionar políticas explícitas de negação às sete tabelas exclusivas do servidor
- [x] Confirmar os três buckets privados e seus limites de arquivo
- [x] Validar cabeçalhos no domínio público e na prévia local
- [x] Confirmar imutabilidade, privilégios e ausência de conteúdo sensível no log de auditoria
- [x] Executar scanner do banco, dependências, acesso anônimo, métodos HTTP e revisão estática
- [x] Registrar resultados e limites em `REVISAO-DE-SEGURANCA-2026-09-29.md`
- [ ] Executar pentest independente certificado antes da abertura pública dos pagamentos

## Contrato profissional v6.2 — 29/09/2026
- [x] Conferir e cadastrar os cinco PDFs originais com seus SHA-256
- [x] Manter os arquivos privados e servi-los por links temporários
- [x] Criar leitura pública dos cinco documentos sem exigir cadastro
- [x] Exigir conferência, rolagem, quatro acessos e sete declarações no aceite
- [x] Tornar acessos e aceites imutáveis e gravados somente pelo servidor
- [x] Travar agenda e publicação até contrato, recebimento e disponibilidade
- [x] Recolocar taxa, explicação e pagamento garantido; remover pedido de seguro
