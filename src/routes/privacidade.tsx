import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e LGPD | TOC Brazil" },
      {
        name: "description",
        content:
          "Como a TOC Brazil usa dados pessoais: finalidades, minimização, base legal, seus direitos e retenção de informações.",
      },
      { property: "og:title", content: "Privacidade e LGPD na TOC Brazil" },
      {
        property: "og:description",
        content:
          "Dados usados com minimização, consentimento quando necessário e controle de acesso por papel.",
      },
      { property: "og:url", content: "/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: Privacidade,
});

const secoes = [
  {
    t: "Uso de dados",
    p: [
      "Coletamos apenas o necessário: dados de identificação e contato, informações de agendamento, dados de pagamento processados por provedor especializado e, no caso de profissionais, documentação de habilitação.",
      "Informações sensíveis eventualmente necessárias ao agendamento recebem proteção reforçada, com acesso restrito ao estritamente necessário.",
    ],
  },
  {
    t: "Finalidades",
    p: [
      "Usamos os dados para viabilizar cadastro, agendamento, pagamento, emissão de documentos fiscais e comunicações essenciais.",
      "Não vendemos dados pessoais e não usamos conteúdo de consultas para publicidade.",
    ],
  },
  {
    t: "Consentimento",
    p: [
      "O agendamento revela que você procurou atendimento psicológico e pode envolver dado pessoal sensível referente à saúde. O tratamento desse dado requer uma base legal adequada e medidas específicas de proteção.",
      "Você pode revogar consentimentos de comunicação a qualquer momento, sem prejuízo dos registros exigidos por obrigação legal.",
    ],
  },
  {
    t: "Acesso segmentado",
    p: [
      "Cada papel acessa apenas o que precisa: o paciente acessa seus próprios dados; o profissional acessa apenas os dados necessários à consulta; a administração acessa dados operacionais, sem acesso a conteúdo clínico.",
      "Ações sensíveis são registradas em log de auditoria.",
    ],
  },
  {
    t: "Videochamada",
    p: [
      "A TOC Brazil não hospeda a videochamada e não tem acesso ao conteúdo das consultas. A sala é do profissional.",
    ],
  },
  {
    t: "Seus direitos",
    p: [
      "Você pode solicitar confirmação de uso dos dados, acesso, correção, portabilidade, anonimização e exclusão, além de informação sobre compartilhamentos, nos termos da LGPD.",
      "Alguns dados devem ser retidos por prazos legais, como registros fiscais e financeiros, mesmo após uma solicitação de exclusão.",
    ],
  },
];

function Privacidade() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <h1 className="heading-page mt-3">Privacidade e LGPD</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Dados pessoais exigem cuidado redobrado. Este documento explica nossa abordagem e será
        revisado por assessoria jurídica antes do lançamento comercial.
      </p>

      <div className="mt-10 max-w-3xl space-y-8">
        {secoes.map((s) => (
          <section key={s.t}>
            <h2 className="heading-subsection">{s.t}</h2>
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
