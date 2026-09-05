import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona nossa plataforma de consultas em TOC | TOC Brazil" },
      {
        name: "description",
        content:
          "Conheça as etapas para entender o transtorno, encontrar o profissional ideal, agendar a sessão e realizar a consulta online.",
      },
      { property: "og:title", content: "Como funciona nossa Plataforma — TOC Brazil" },
      {
        property: "og:description",
        content:
          "Quatro etapas: entenda o transtorno, encontre o profissional ideal, agende a sessão e realize sua consulta online.",
      },

      { property: "og:url", content: "/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "/como-funciona" }],
  }),
  component: ComoFunciona,
});

const etapas = [
  {
    t: "Entenda mais sobre o transtorno",
    d: "Textos didáticos e explicativos sobre TOC",
  },
  {
    t: "Encontre o profissional ideal",
    d: "Escolha o profissional que melhor atende às suas necessidades a partir de filtros de pesquisa avançados.",
  },
  {
    t: "Agende uma sessão online",
    d: "Escolha o melhor horário pra você disponível na agenda do profissional",
  },
  {
    t: "Realize sua consulta online",
    d: "A consulta acontece por videochamada, no horário combinado, através da plataforma.",
  },
];


const perguntas = [
  {
    q: "A TOC Brazil faz diagnóstico?",
    a: "Não. Somos infraestrutura tecnológica e conteúdo educativo. Avaliação, diagnóstico e conduta são de responsabilidade do profissional habilitado.",
  },
  {
    q: "Posso remarcar ou cancelar?",
    a: "Sim, respeitando a política de cancelamento informada em cada perfil profissional. Reembolsos seguem essa política e as regras da plataforma.",
  },
  {
    q: "A consulta é gravada?",
    a: "Não. As videochamadas não são gravadas por padrão.",
  },
  {
    q: "Preciso de psicólogo ou de psiquiatra?",
    a: "Essa definição depende de avaliação profissional. Você pode começar por qualquer um dos dois; muitas pessoas fazem acompanhamento com ambos.",
  },
];

function ComoFunciona() {
  return (
    <>
      <section className="container-page py-14 lg:py-20">
        <span className="section-label">Nossa metodologia</span>
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight sm:text-5xl">
          Como funciona nossa Plataforma
        </h1>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <ol className="grid gap-5 lg:grid-cols-4">
            {etapas.map((e, i) => (
              <li key={e.t} className="card-soft p-6">
                <span className="step-index">{i + 1}</span>
                <h2 className="mt-4 text-lg">{e.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Encontrar um especialista
            </Link>
          </div>
        </div>

      </section>

      <section aria-labelledby="duvidas" className="container-page py-14 lg:py-20">
        <h2 id="duvidas" className="text-2xl sm:text-3xl">
          Dúvidas frequentes
        </h2>
        <dl className="mt-8 grid gap-5 md:grid-cols-2">
          {perguntas.map((p) => (
            <div key={p.q} className="card-soft p-6">
              <dt className="text-lg">{p.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
