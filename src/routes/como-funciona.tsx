import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona a TOC Brazil" },
      {
        name: "description",
        content:
          "Entenda como buscar psicólogos, agendar consultas online, pagar pela plataforma e acessar o link da sala do próprio psicólogo.",
      },
      { property: "og:title", content: "Como funciona a TOC Brazil" },
      {
        property: "og:description",
        content:
          "Busca, agenda e pagamento para consultas com psicólogos cadastrados na plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "/como-funciona" }],
  }),
  component: ComoFunciona,
});

const etapas = [
  {
    t: "Entenda sobre o transtorno",
    d: "Leia conteúdos educativos sobre TOC. Eles não substituem consulta com profissional habilitado.",
  },
  {
    t: "Encontre um psicólogo",
    d: "Compare abordagem, idioma, valor, duração e horários disponíveis em cada perfil.",
  },
  {
    t: "Agende uma consulta online",
    d: "Escolha o horário e confirme o pagamento pela plataforma. A reserva aguarda pagamento por 15 minutos.",
  },
  {
    t: "Receba o link e entre na sala do seu psicólogo",
    d: "A sala de videochamada é do profissional. O link fica disponível para você 15 minutos antes do horário.",
  },
];

const perguntas = [
  {
    q: "A TOC Brazil faz diagnóstico?",
    a: "Não. Somos uma empresa de tecnologia. A avaliação é feita por profissional habilitado, em consulta.",
  },
  {
    q: "A TOC Brazil presta serviço psicológico?",
    a: "Não. Quem presta o serviço é o psicólogo. A plataforma oferece busca, agendamento, pagamento e comunicação administrativa.",
  },
  {
    q: "A consulta acontece onde?",
    a: "Na sala de videochamada do próprio psicólogo, contratada e mantida por ele. A TOC Brazil apenas guarda o link e transmite no horário agendado.",
  },
  {
    q: "Como escolho um psicólogo?",
    a: "Você pode comparar abordagem, idioma, valor, duração, horários e informações declaradas no perfil, sem ranking por desempenho ou destaque pago.",
  },
  {
    q: "O que a plataforma confere?",
    a: "Conferimos a inscrição ativa no CRP e os documentos de formação apresentados. Não avaliamos competência técnica nem garantimos resultado.",
  },
  {
    q: "Como funciona o pagamento da consulta?",
    a: "O paciente paga exatamente o valor definido pelo psicólogo. A taxa da plataforma é fixa em reais por consulta realizada e é paga pelo profissional.",
  },
  {
    q: "Posso remarcar ou cancelar?",
    a: "Sim, conforme a janela de cancelamento configurada. Cancelamentos dentro do prazo podem gerar estorno pelo meio de pagamento.",
  },
  {
    q: "Meus dados são protegidos?",
    a: "Sim. Cada área possui acesso próprio, e a gestão acessa apenas dados operacionais necessários à plataforma.",
  },
];

function ComoFunciona() {
  return (
    <>
      <section className="container-page py-14 lg:py-20">
        <span className="section-label">Como funciona</span>
        <h1 className="heading-page mt-4">Como funciona</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          A TOC Brazil é uma plataforma de tecnologia para buscar psicólogos com experiência em TOC, agendar consultas online e realizar o pagamento. A consulta acontece fora da plataforma, na sala do próprio psicólogo.
        </p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <ol className="grid items-stretch gap-5 lg:grid-cols-4">
            {etapas.map((e, i) => (
              <li key={e.t} className="card-soft h-full p-6">
                <span className="step-index">{i + 1}</span>
                <h2 className="heading-card mt-4">{e.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Ver psicólogos disponíveis
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="duvidas" className="container-page py-14 lg:py-20">
        <h2 id="duvidas" className="heading-section">Dúvidas frequentes</h2>
        <dl className="mt-8 grid gap-5 md:grid-cols-2">
          {perguntas.map((p) => (
            <div key={p.q} className="card-soft p-6">
              <dt className="heading-subsection">{p.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
