# Roadmap — TOC Brazil

## Concluído
- [x] Design system, landing page e conteúdos educativos sobre TOC
- [x] Marketplace de profissionais, perfis, matching e páginas legais
- [x] Seção "Dúvida se você tem TOC?" e CTA final "Seu tratamento correto começa aqui"
- [x] Backend (Lovable Cloud) ligado
- [x] Login e cadastro de paciente (e-mail/senha + Google), papéis e regras de acesso (RLS)
- [x] Banco: perfis, papéis, profissionais, dados de repasse, disponibilidade, bloqueios,
      consultas, pagamentos, repasses, notificações, configurações
- [x] Agenda real com horários livres calculados e proteção contra dois agendamentos no mesmo horário
- [x] Fluxo de agendamento (reserva + resumo + valor) e painel do paciente com histórico e lembretes
- [x] Vitrine e perfis lendo dados reais do banco
- [x] Cadastro e verificação documental do profissional + painel do profissional
- [x] Painel do administrador: usuários, consultas, status de pagamento e aprovações
- [x] Avaliação do profissional pelo paciente (até 5 estrelas) exibida no perfil
- [x] Calendário de consultas e link de videochamada na área do paciente
- [x] Pagamento com Mercado Pago (Checkout Pro) + confirmação automática por webhook
- [x] Aba "Pagamentos aos profissionais" com valores a receber e histórico separado
- [x] Atualização automática da agenda e do financeiro profissional
- [x] Líquido profissional de 80% nas novas consultas e repasses
- [x] Validar links exclusivos de videochamada, calendário e anotações por consulta
- [x] Atualizar subtipos de TOC, idiomas, abordagem TCC, conteúdo educativo e paleta azul
- [x] Separar permissões de paciente, profissional e gestor, sem expor contatos do paciente
- [x] Tratar o sinal de agendamento como parte do valor total da consulta
- [x] Alinhar calendário e benefício do paciente e revisar contraste da área profissional
- [x] Adicionar acesso discreto e protegido para a gestão
- [x] Simplificar filtros de profissionais, incluir Psicanálise e ampliar dúvidas frequentes

- [x] Três áreas isoladas (paciente / profissional / gestor) com papel fixado no primeiro acesso,
      bloqueio de URL cruzada, aviso de conta conectada em outra área, visual navy da área
      profissional e logo com fundo transparente

## Próximas etapas
- [ ] Conectar `tocbrazil.com.br` ao projeto e orientar a configuração do domínio (card cancelado pelo usuário; instruções manuais fornecidas)
- [x] Aplicar a nova logo enviada, atualizar o favicon e substituir os azuis por uma paleta verde moderna e discreta
- [x] Diferenciar os acessos de entrar/criar conta e as áreas de paciente/profissional
- [x] Revisar textos, menu do paciente, subtipos de TOC e chamadas repetidas
- [x] Revisão dos 3 perfis: calendário do paciente, livro Hotmart (50%), taxa de R$ 50 +
      comissão só após consulta realizada, agenda visual do profissional (mês/semana/dia),
      ficha sigilosa e anotações, financeiro/extrato, painel do gestor com abas, página
      "Sou profissional" com login visível e recuperação de senha
- [ ] Link definitivo da Hotmart (aguardando a TOC Brazil) — campo já existe em Configurações
- [ ] Split automático do repasse ao profissional (exige adesão de cada profissional ao Mercado Pago)
- [ ] Videochamada com sala própria (hoje usa sala segura gerada por consulta)
- [ ] Envio real de e-mails/WhatsApp dos lembretes já gravados
- [ ] Recibo/NFS-e e reembolso automatizado (prazo de cancelamento já configurável)
- [ ] 2FA, logs de auditoria, retenção de dados e sitemap/analytics de funil
