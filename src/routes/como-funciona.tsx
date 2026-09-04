import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona: do conteúdo à consulta online | TOC Brazil" },
      {
        name: "description",
        content:
          "Entenda cada etapa: conteúdo educativo sobre TOC, escolha do profissional, agendamento, pagamento, videochamada e acompanhamento.",
      },
      { property: "og:title", content: "Como funciona a TOC Brazil" },
      {
        property: "og:description",
        content:
          "Cinco etapas simples: entender, encontrar, escolher, agendar e começar o acompanhamento online.",
      },
      { property: "og:url", content: "/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "/como-funciona" }],
  }),
  component: ComoFunciona,
});

const etapas = [
  {
    t: "Entender",
    d: "Comece pelos conteúdos educativos sobre TOC. Você decide o ritmo e não precisa preencher nada para ler.",
  },
  {
    t: "Encontrar",
    d: "Veja perfis de psicólogos e psiquiatras com formação, abordagem, áreas de atuação, idiomas, valores e horários.",
  },
  {
    t: "Escolher",
    d: "Use os filtros ou responda ao matching de preferências. A ordenação é neutra: não há ranking de popularidade.",
  },
  {
    t: "Agendar",
    d: "Escolha um horário disponível na agenda do profissional e conclua o pagamento online. A consulta é confirmada após a aprovação.",
  },
  {
    t: "Começar",
    d: "A consulta acontece por videochamada no navegador, no horário combinado, sem instalar nada e sem gravação por padrão.",
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
        <span className="section-label">Como funciona</span>
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight sm:text-5xl">
          Da primeira leitura até a sua consulta.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A jornada foi desenhada para reduzir fricção e devolver a você o controle de cada
          decisão.
        </p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <ol className="grid gap-5 lg:grid-cols-5">
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
            <Link to="/matching" className="btn-base btn-ghost">
              Responder o matching
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
