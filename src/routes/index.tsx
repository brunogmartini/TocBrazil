import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import heroImg from "@/assets/hero-paciente.jpg";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOC Brazil — plataforma especializada em TOC" },
      {
        name: "description",
        content:
          "Plataforma especializada em Transtorno Obsessivo-Compulsivo: metodologia própria, conteúdo especializado e profissionais selecionados, com atendimento online.",
      },
      {
        property: "og:title",
        content: "TOC Brazil — especialização, metodologia e profissionais selecionados",
      },
      {
        property: "og:description",
        content:
          "Uma jornada estruturada de cuidado em TOC: conhecimento, metodologia e profissionais selecionados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TOC Brazil",
          description:
            "Plataforma especializada em TOC que reúne conhecimento, metodologia e profissionais selecionados.",
          url: "/",
        }),
      },
    ],
  }),
  component: Home,
});

const passos = [
  {
    titulo: "Entenda sobre o transtorno",
    texto: "Tenha acesso a conteúdos sobre TOC para entender mais sobre o transtorno.",
  },
  {
    titulo: "Encontre o profissional ideal",
    texto:
      "Escolha o profissional que melhor atende às suas necessidades a partir de filtros de pesquisa avançados.",
  },
  {
    titulo: "Agende uma sessão online",
    texto: "Escolha o melhor horário pra você disponível na agenda do profissional",
  },
  {
    titulo: "Realize sua consulta online",
    texto: "A consulta acontece por videochamada, no horário combinado, através da plataforma.",
  },
];

const pilares = [
  {
    titulo: "Especialização",
    texto:
      "Nosso foco é o TOC e as necessidades de quem busca cuidado relacionado ao transtorno.",
  },
  {
    titulo: "Curadoria",
    texto:
      "Profissionais selecionados, com formação, abordagem e experiência verificadas antes da publicação do perfil.",
  },
  {
    titulo: "Metodologia",
    texto:
      "Uma sequência clara de etapas, do entendimento do transtorno ao acompanhamento com profissional habilitado.",
  },
  {
    titulo: "Jornada",
    texto:
      "Descoberta, escolha, agendamento e atendimento reunidos em uma experiência integrada e contínua.",
  },
];

const identificacao = [
  {
    t: "Checagens que não terminam",
    d: "Conferir a porta, o gás, mensagens enviadas ou o próprio corpo várias vezes, sem que a dúvida realmente passe.",
  },
  {
    t: "Pensamentos que assustam",
    d: "Imagens ou ideias intrusivas sobre agressão, contaminação, moral, religião ou sexualidade que aparecem sem convite.",
  },
  {
    t: "Rituais mentais",
    d: "Contar, repetir frases, revisar lembranças ou pedir garantias para tentar aliviar o desconforto.",
  },
  {
    t: "Evitação do dia a dia",
    d: "Deixar de tocar objetos, ir a lugares, dirigir ou ficar sozinho com certas pessoas para não sentir a angústia.",
  },
  {
    t: "Tempo consumido",
    d: "Horas do dia comprometidas, atrasos no trabalho ou nos estudos e cansaço que ninguém ao redor entende.",
  },
  {
    t: "Explicar de novo cansa",
    d: "Já tentou terapia antes e sentiu que precisava explicar o TOC ao profissional em vez de ser cuidado.",
  },
];


function Home() {
  useEffect(() => {
    track("landing_view", { page: "home" });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="rise-in">
            <span className="pill">Plataforma especializada em TOC</span>
            <h1 className="mt-6 text-[2.3rem] leading-[1.12] sm:text-[2.7rem] lg:text-[2.55rem] xl:text-[3rem]">
              Conectando você aos melhores profissionais com experiência em TOC
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Consultas online com psicólogos e psiquiatras com experiência em transtorno
              obsessivo compulsivo sem sair de casa e no horário que cabe na sua rotina. Selecione
              profissionais de acordo com o seu perfil e as suas necessidades.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth"
                search={{ modo: "cadastro" as const, redirect: undefined }}
                className="btn-base btn-primary"
              >
                Quero fazer parte
              </Link>
              <Link to="/profissionais" className="btn-base btn-ghost">
                Ver profissionais
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/70 blur-2xl"
            />
            <img
              src={heroImg}
              alt="Mulher sentada perto da janela, com uma caneca nas mãos, em um ambiente tranquilo"
              width={1408}
              height={1600}
              className="w-full rounded-[2rem] object-cover shadow-[var(--shadow-lift)]"
            />
          </div>
        </div>
      </section>

      {/* Nossa metodologia + diferencial */}
      <section aria-labelledby="metodologia" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-24">
          <span className="section-label">Diferencial</span>
          <h2 id="metodologia" className="mt-3 max-w-3xl text-4xl sm:text-5xl">
            Nossa metodologia
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Não somos apenas uma plataforma de consultas online. Somos uma plataforma especializada
            em TOC, que reúne conhecimento, metodologia e profissionais selecionados em uma jornada
            estruturada de cuidado.
          </p>

          <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pilares.map((p) => (
              <article key={p.titulo} className="card-soft h-full p-7">
                <h3 className="font-display text-xl">{p.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
              </article>
            ))}
          </div>

          <h3 className="mt-14 font-display text-3xl">As etapas da sua jornada</h3>
          <ol className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((passo, i) => (
              <li key={passo.titulo} className="card-soft card-soft-hover h-full p-6">
                <span className="step-index">{i + 1}</span>
                <h4 className="mt-4 text-lg">{passo.titulo}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Profissionais */}
      <section aria-labelledby="profissionais" className="container-page py-16 lg:py-24">
        <div className="max-w-2xl">
          <span className="section-label">Profissionais</span>
          <h2 id="profissionais" className="mt-3 text-3xl sm:text-4xl">
            Psicólogos e psiquiatras com experiência na área.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cada profissional declara formação, abordagem, subtipos atendidos e experiência e a
            documentação é verificada antes da publicação do perfil. Você escolhe quem faz mais
            sentido para você.
          </p>
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ modo: "cadastro" as const, redirect: undefined }}
            className="btn-base btn-primary"
          >
            Quero fazer parte
          </Link>
          <Link to="/profissionais" className="btn-base btn-ghost">
            Ver profissionais
          </Link>
        </div>
      </section>

      {/* Identificação */}
      <section aria-labelledby="identificacao" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="section-label">Identificação</span>
            <h2 id="identificacao" className="mt-3 text-3xl sm:text-4xl">
              Talvez você já reconheça alguma destas situações.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nem todo profissional tem experiência com TOC - e explicar tudo novamente, cansa.
              Aqui, os profissionais já atuam nessa área.
            </p>
          </div>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {identificacao.map((item) => (
              <li key={item.t} className="card-soft p-6">
                <h3 className="text-lg">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Ver profissionais
            </Link>
            <Link to="/entenda-o-toc" className="btn-base btn-ghost">
              Entender melhor o TOC
            </Link>
          </div>
        </div>
      </section>

      {/* Dúvida se tem TOC */}
      <section aria-labelledby="duvida-toc" className="container-page py-16 lg:py-20">
        <div className="card-soft overflow-hidden p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="section-label">Diagnóstico</span>
              <h2 id="duvida-toc" className="mt-3 text-3xl leading-tight sm:text-5xl">
                Dúvida se você tem TOC?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Agende um horário com profissional com experiência em TOC e descubra.
              </p>
              <p className="mt-6 font-display text-2xl text-foreground sm:text-3xl">
                O diagnóstico é o primeiro passo.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Você não precisa continuar tentando entender sozinho o que está acontecendo.
                Conversar com um profissional especializado em TOC ajuda a dar nome ao que você
                sente e a encontrar o cuidado adequado, no seu tempo e sem julgamento.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/profissionais" className="btn-base btn-primary">
                  Agendar avaliação
                </Link>
                <Link to="/entenda-o-toc" className="btn-base btn-ghost">
                  Entender melhor o TOC
                </Link>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="rounded-2xl bg-surface p-5">
                Uma primeira conversa serve para entender sua história — não é um teste nem um
                rótulo.
              </li>
              <li className="rounded-2xl bg-surface p-5">
                Quem avalia é sempre um psicólogo ou psiquiatra habilitado; a plataforma não faz
                diagnóstico.
              </li>
              <li className="rounded-2xl bg-surface p-5">
                Tudo acontece por videochamada, no seu horário, de onde você estiver.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Acolhimento */}
      <section aria-labelledby="acolhimento" className="container-page pb-4 lg:pb-8">
        <div className="card-soft mx-auto max-w-3xl p-8 text-center sm:p-12">
          <span className="section-label">Acolhimento</span>
          <h2 id="acolhimento" className="mt-4 text-3xl sm:text-4xl">
            Você não precisa enfrentar tudo isso sozinho.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Buscar ajuda pode ser difícil, especialmente quando determinados pensamentos ou
            comportamentos causam vergonha, medo ou confusão.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Aqui, você encontra conteúdo especializado e profissionais selecionados para dar o
            próximo passo com mais segurança.
          </p>
          <Link
            to="/entenda-o-toc"
            className="mt-8 inline-flex font-semibold text-primary underline underline-offset-4"
          >
            Entender melhor o TOC
          </Link>
        </div>
      </section>

      {/* Do entendimento ao cuidado */}
      <section
        aria-labelledby="conceito"
        className="mt-16 border-y border-border bg-primary text-primary-foreground"
      >
        <div className="container-page py-20 lg:py-28">
          <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/70">
            Nossa ideia central
          </p>
          <h2 id="conceito" className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
            Do entendimento ao cuidado.
          </h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 text-lg leading-relaxed text-primary-foreground/85">
              <p>Talvez você tenha chegado aqui procurando uma resposta.</p>
              <p>Talvez tenha visto um conteúdo no Instagram.</p>
              <p>
                Talvez esteja tentando entender pensamentos, dúvidas ou comportamentos que vêm
                ocupando espaço demais na sua vida.
              </p>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-primary-foreground/85">
              <p className="font-display text-2xl text-primary-foreground">
                Você não precisa descobrir tudo sozinho.
              </p>
              <p>Deixe que um profissional qualificado lhe ajude no processo.</p>
              <Link
                to="/profissionais"
                className="btn-base mt-2 bg-background text-foreground hover:bg-background/90"
              >
                Ver profissionais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança e privacidade */}
      <section aria-labelledby="seguranca" className="border-y border-border bg-surface">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="section-label">Segurança e privacidade</span>
            <h2 id="seguranca" className="mt-3 text-3xl sm:text-4xl">
              Dados de saúde exigem cuidado redobrado.
            </h2>
            <Link to="/seguranca" className="btn-base btn-ghost mt-8">
              Como protegemos seus dados
            </Link>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li className="card-soft p-5">
              Coletamos apenas os dados necessários para agendamento, pagamento e documentação
              fiscal, seguindo os princípios da LGPD.
            </li>
            <li className="card-soft p-5">
              As consultas acontecem por videochamada no navegador e não são gravadas por padrão.
            </li>
            <li className="card-soft p-5">
              Acesso segmentado por papel: você acessa apenas os seus dados; o profissional acessa
              apenas o necessário para o atendimento. Documentos de verificação ficam restritos à
              equipe autorizada.
            </li>
            <li className="card-soft p-5">
              A plataforma não realiza diagnósticos, não prescreve tratamentos e não promete
              resultados. O atendimento é de responsabilidade do profissional habilitado.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section aria-labelledby="cta-final" className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-final" className="text-4xl leading-tight sm:text-6xl">
            Seu tratamento assertivo começa aqui.
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Pacientes e profissionais fazem parte da mesma jornada de cuidado especializado em TOC.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ modo: "cadastro" as const, redirect: undefined }}
              className="btn-base btn-primary"
            >
              Quero fazer parte
            </Link>
            <Link to="/profissionais" className="btn-base btn-ghost">
              Ver profissionais
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            É profissional de saúde mental?{" "}
            <Link to="/cadastro-profissional" className="font-semibold underline underline-offset-4">
              Comece seu cadastro profissional
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
