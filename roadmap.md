# Roadmap — plataforma de psicologia online

## Concluído
- [x] Design system (azul petróleo + verde-sálvia, off-white, Fraunces + Plus Jakarta Sans)
- [x] Landing page de conversão (hero, como funciona, filtros, prova de confiança)
- [x] Marketplace de profissionais com filtros e ordenação neutra (dados de demonstração)
- [x] Perfil público do profissional com calendário de disponibilidade
- [x] Landing de campanha /toc (mobile-first, sem linguagem alarmista)
- [x] Página para profissionais (/para-psicologos) com fluxo de cadastro e status

## Próximas etapas
- [ ] Backend (Lovable Cloud): autenticação, papéis (paciente/psicólogo/admin), RLS
- [ ] Cadastro de paciente (mínimo de dados, consentimentos LGPD)
- [ ] Cadastro + verificação documental do psicólogo (status e aprovação)
- [ ] Banco de dados: User, Patient, Psychologist, Verification, Availability,
      Appointment, Payment, PaymentSplit, Payout, Refund, Invoice, VideoSession,
      Notification, Consent, AuditLog, SupportTicket, Report, PlatformSettings
- [ ] Agenda/disponibilidade com prevenção de double booking
- [ ] Fluxo de agendamento + checkout (provedor com split payment BR)
- [ ] Dashboards: paciente, psicólogo, admin
- [ ] Videochamada via SDK (sem gravação por padrão)
- [ ] InvoiceService (NFS-e) e NotificationService (e-mail transacional)
- [ ] Segurança: 2FA, rate limiting, logs de auditoria, retenção de dados
- [ ] Páginas legais: Termos, Privacidade, Cookies, gestão de preferências
- [ ] SEO: sitemap, schema, UTM/analytics de funil
