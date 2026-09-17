import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | TOC Brazil" },
      {
        name: "description",
        content:
          "Condições de uso da TOC Brazil: papel da plataforma como infraestrutura tecnológica, responsabilidades do profissional e do paciente, pagamentos e cancelamentos.",
      },
      { property: "og:title", content: "Termos de Uso da TOC Brazil" },
      {
        property: "og:description",
        content:
          "Regras de uso da plataforma, responsabilidades e limites de atuação da TOC Brazil.",
      },
      { property: "og:url", content: "/termos" },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: Termos,
});

const secoes = [
  {
    t: "1. Natureza da plataforma",
    p: [
      "A TOC Brazil é uma plataforma de tecnologia que conecta pessoas interessadas em acompanhamento de saúde mental a profissionais habilitados de Psicologia.",
      "A TOC Brazil não presta serviços de saúde, não realiza identificação clínicas, não prescreve cuidados e não promete desfechos terapêuticos.",
    ],
  },
  {
    t: "2. Responsabilidade profissional",
    p: [
      "O atendimento é de responsabilidade exclusiva do profissional habilitado, que responde pela sua conduta perante seu conselho de classe (CFP) e pela legislação aplicável.",
      "A plataforma não interfere na conduta clínica, no plano de cuidado ou em qualquer decisão profissional.",
    ],
  },
  {
    t: "3. Cadastro e verificação",
    p: [
      "Profissionais devem informar dados verdadeiros e enviar documentação para verificação. O perfil é publicado apenas após aprovação.",
      "A plataforma pode solicitar correções, suspender ou remover perfis em caso de inconsistência, irregularidade de registro ou violação destes termos.",
    ],
  },
  {
    t: "4. Agendamento, pagamento e cancelamento",
    p: [
      "A consulta é confirmada após a aprovação do pagamento. A plataforma cobra uma taxa pelo uso da infraestrutura, informada de forma transparente ao profissional.",
      "Cancelamentos e reembolsos seguem a política informada no perfil do profissional e as regras da plataforma. Pagamentos nunca são simulados: valores só são movimentados por meio de provedor de pagamento oficialmente integrado.",
    ],
  },
  {
    t: "5. Uso adequado",
    p: [
      "É vedado utilizar a plataforma para fins ilícitos, para divulgar informação enganosa em saúde ou para prometer cura, identificação clínica automático ou resultado garantido.",
      "Conteúdos educativos publicados pela TOC Brazil têm finalidade informativa e não substituem consulta com profissional habilitado.",
    ],
  },
  {
    t: "6. Emergências",
    p: [
      "A plataforma não é um serviço de emergência. Em situação de risco imediato, procure atendimento presencial de urgência ou os serviços públicos de emergência disponíveis na sua região.",
    ],
  },
];

function Termos() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <h1 className="heading-page mt-3">Termos de Uso</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Este documento descreve as condições de uso da TOC Brazil. Ele será revisado por assessoria
        jurídica antes do lançamento comercial.
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
        <Link to="/privacidade" className="btn-base btn-ghost">
          Política de Privacidade
        </Link>
        <Link to="/cookies" className="btn-base btn-ghost">
          Política de Cookies
        </Link>
      </div>
    </div>
  );
}
