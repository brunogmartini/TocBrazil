import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e LGPD | Clarea" },
      {
        name: "description",
        content:
          "Como a Clarea trata dados pessoais e dados sensíveis de saúde: finalidades, minimização, base legal, seus direitos e retenção de informações.",
      },
      { property: "og:title", content: "Privacidade e LGPD na Clarea" },
      {
        property: "og:description",
        content:
          "Tratamento de dados com minimização, consentimento explícito e controle de acesso por papel.",
      },
      { property: "og:url", content: "/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: Privacidade,
});

const secoes = [
  {
    t: "Dados que tratamos",
    p: [
      "Coletamos apenas o necessário: dados de identificação e contato, informações de agendamento, dados de pagamento processados por provedor especializado e, no caso de profissionais, documentação de habilitação.",
      "Dados relacionados à saúde são considerados dados pessoais sensíveis pela LGPD e recebem proteção reforçada, com acesso restrito ao estritamente necessário.",
    ],
  },
  {
    t: "Finalidades",
    p: [
      "Usamos os dados para viabilizar o agendamento, o pagamento, a realização da consulta por videochamada, a emissão de documentos fiscais e as comunicações essenciais do serviço.",
      "Não vendemos dados pessoais e não usamos conteúdo de consultas para publicidade.",
    ],
  },
  {
    t: "Consentimento",
    p: [
      "O tratamento de dados sensíveis de saúde ocorre com consentimento explícito e específico, registrado com data e finalidade.",
      "Você pode revogar consentimentos de comunicação a qualquer momento, sem prejuízo dos registros exigidos por obrigação legal.",
    ],
  },
  {
    t: "Acesso segmentado",
    p: [
      "Cada papel acessa apenas o que precisa: o paciente acessa seus próprios dados; o profissional acessa apenas os dados necessários ao atendimento; a administração acessa dados operacionais, sem acesso a conteúdo clínico.",
      "Ações sensíveis são registradas em log de auditoria.",
    ],
  },
  {
    t: "Videochamada",
    p: [
      "As consultas não são gravadas por padrão. Qualquer gravação dependeria de consentimento explícito e específico das partes envolvidas.",
    ],
  },
  {
    t: "Seus direitos",
    p: [
      "Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização e exclusão de dados, além de informação sobre compartilhamentos, nos termos da LGPD.",
      "Alguns dados devem ser retidos por prazos legais, como registros fiscais e financeiros, mesmo após uma solicitação de exclusão.",
    ],
  },
];

function Privacidade() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Privacidade e LGPD</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Dados de saúde exigem cuidado redobrado. Este documento explica nossa abordagem e será
        revisado por assessoria jurídica antes do lançamento comercial.
      </p>

      <div className="mt-10 max-w-3xl space-y-8">
        {secoes.map((s) => (
          <section key={s.t}>
            <h2 className="text-xl">{s.t}</h2>
            {s.p.map((par) => (
              <p key={par.slice(0, 24)} className="mt-3 leading-relaxed text-muted-foreground">
                {par}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link to="/seguranca" className="btn-base btn-ghost">
          Como protegemos seus dados
        </Link>
        <Link to="/suporte" className="btn-base btn-ghost">
          Falar com o suporte
        </Link>
      </div>
    </div>
  );
}
