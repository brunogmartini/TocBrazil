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
- [ ] Aplicar e verificar cabeçalhos de segurança e investigar cookie de sessão (proteção contra iframe ativa; CSP ampla em relatório até ajustar scripts inline; cookie session-id não é emitido pelo app)
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
- [ ] Adicionar TOTP opcional na área do psicólogo
- [ ] Validar cabeçalhos, cookies, bundle, desktop e 375 px; emitir relatório final
- [ ] Separar banco de prévia e produção (depende de infraestrutura externa)
