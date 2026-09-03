# Roadmap — plataforma de psicologia online

## Concluído
- [x] Design system (azul petróleo + verde-sálvia, off-white, Space Grotesk + Plus Jakarta Sans)
- [x] Landing page de conversão (hero, como funciona, filtros, prova de confiança)
- [x] Marketplace de profissionais com filtros e ordenação neutra (dados de demonstração)
- [x] Perfil público do profissional com calendário de disponibilidade
- [x] Hub de conteúdos educativos sobre TOC
- [x] Matching por preferências declaradas
- [x] Landing de campanha /toc redirecionada para /entenda-o-toc
- [x] Páginas para profissionais (/para-psicologos, /para-psiquiatras) com fluxo de cadastro
- [x] Páginas legais e de confiança (Termos, Privacidade, Cookies, Segurança, Suporte)
- [x] Roteamento consolidado em /profissionais com redirecionamentos de /psicologos
- [x] CTA mobile fixo e navegação Clarea

## Próximas etapas
- [ ] Backend (Lovable Cloud): autenticação, papéis (paciente/psicólogo/psiquiatra/admin), RLS
- [ ] Cadastro de paciente (mínimo de dados, consentimentos LGPD)
- [ ] Cadastro + verificação documental do profissional (status e aprovação)
- [ ] Banco de dados: User, Patient, Psychologist, Psychiatrist, Verification, Availability,
      Appointment, Payment, PaymentSplit, Payout, Refund, Invoice, VideoSession,
      Notification, Consent, AuditLog, SupportTicket, Report, PlatformSettings
- [ ] Agenda/disponibilidade com prevenção de double booking
- [ ] Fluxo de agendamento + checkout (provedor com split payment BR)
- [ ] Dashboards: paciente, profissional, admin
- [ ] Videochamada via SDK (sem gravação por padrão)
- [ ] InvoiceService (NFS-e) e NotificationService (e-mail transacional)
- [ ] Segurança: 2FA, rate limiting, logs de auditoria, retenção de dados
- [ ] SEO: sitemap, schema, UTM/analytics de funil
