import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/seja-parceiro")({
  head: () => ({
    meta: [
      { title: "Seja um profissional parceiro | TOC Brazil" },
      {
        name: "description",
        content:
          "Psicólogos e psiquiatras com experiência em TOC: apresente seu trabalho, organize sua agenda e atenda online em uma plataforma especializada.",
      },
      { property: "og:title", content: "Seja um profissional parceiro da TOC Brazil" },
      {
        property: "og:description",
        content:
          "Faça parte de uma rede especializada em TOC: perfil verificado, agenda organizada e atendimento online sem links externos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/seja-parceiro" },
    ],
    links: [{ rel: "canonical", href: "/seja-parceiro" }],
  }),
  component: SejaParceiro,
});

const beneficios = [
  {
    t: "Mais visibilidade",
    d: "Apresente seu trabalho para pessoas que já estão buscando acompanhamento relacionado ao TOC.",
  },
  {
    t: "Agenda organizada",
    d: "Defina seus horários e deixe a plataforma cuidar dos agendamentos, sem conflitos de horário.",
  },
  {
    t: "Atendimento online",
    d: "Videochamada no navegador, sem enviar links externos e sem gravação por padrão.",
  },
  {
    t: "Perfil verificado",
    d: "Sua documentação profissional é verificada antes da publicação do perfil.",
  },
  {
    t: "Gestão do atendimento",
    d: "Acompanhe consultas, reagendamentos e o histórico do seu trabalho na plataforma.",
  },
  {
    t: "Infraestrutura pronta",
    d: "Tecnologia, segurança e conformidade cuidadas por nós, para você focar na clínica.",
  },
];

const etapas = [
  "Envie seus dados e sua documentação profissional.",
  "Passe pela verificação de registro no conselho.",
  "Monte seu perfil com formação, abordagem e subtipos atendidos.",
  "Configure sua agenda e comece a receber agendamentos.",
];

function SejaParceiro() {
  return (
    <>
      <section className="container-page py-14 lg:py-20">
        <span className="section-label">Para profissionais</span>
        <h1 className="heading-page mt-4 max-w-3xl">
          Você cuida do paciente. Nós cuidamos do resto.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Faça parte de uma rede especializada em conectar psicólogos e psiquiatras com
          experiência em TOC a pessoas que procuram acompanhamento.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/cadastro-profissional" className="btn-base btn-primary">
            Quero fazer parte
          </Link>

          <Link to="/como-funciona" className="btn-base btn-ghost">
            Nossa metodologia
          </Link>
        </div>
      </section>

      <section aria-labelledby="beneficios" className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 id="beneficios" className="heading-section">
            O que você encontra aqui
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((b) => (
              <article key={b.t} className="card-soft card-soft-hover p-6">
                <h3 className="heading-subsection">{b.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="etapas" className="container-page py-14 lg:py-20">
        <h2 id="etapas" className="heading-section">
          Como entrar na plataforma
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {etapas.map((e, i) => (
            <li key={e} className="card-soft p-6">
              <span className="step-index">{i + 1}</span>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{e}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to="/para-psicologos" className="btn-base btn-ghost">
            Sou psicólogo
          </Link>
          <Link to="/para-psiquiatras" className="btn-base btn-ghost">
            Sou psiquiatra
          </Link>
          <Link to="/cadastro-profissional" className="btn-base btn-primary">
            Fazer meu cadastro
          </Link>
        </div>
      </section>
    </>
  );
}
