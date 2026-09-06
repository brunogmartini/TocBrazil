import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import heroImg from "@/assets/hero-paciente.jpg";
import { PROFISSIONAIS_DEMO } from "@/lib/profissionais-mock";

import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOC Brazil — profissionais com experiência em TOC" },
      {
        name: "description",
        content:
          "TOC Brazil conecta pacientes a psicólogos e psiquiatras com experiência em TOC. Consultas online, no seu horário, com o profissional que você escolher.",
      },
      { property: "og:title", content: "Conectando pacientes aos melhores profissionais com experiência em TOC do Brasil" },
      {
        property: "og:description",
        content:
          "Consultas online com psicólogos e psiquiatras com experiência em TOC. Você escolhe o profissional com quem mais se identifica.",
      },
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
            "Plataforma especializada em TOC que reúne informação confiável e acesso a profissionais de Psicologia e Psiquiatria.",
          url: "/",
        }),
      },
    ],
  }),
  component: Home,
});

const passos = [
  { titulo: "Entenda mais sobre o transtorno", texto: "Textos didáticos e explicativos sobre TOC" },
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
    texto:
      "A consulta acontece por videochamada, no horário combinado, através da plataforma.",
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
      "Apresentamos profissionais com informações claras sobre formação, áreas de atuação e experiência declarada.",
  },
  {
    titulo: "Jornada",
    texto:
      "Da informação à consulta, reunimos descoberta, escolha, agendamento e atendimento em uma experiência integrada.",
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

const praticidade = [
  {
    t: "Consulta 100% online",
    d: "Videochamada no navegador, sem instalar aplicativo, sem link externo e sem gravação por padrão.",
  },
  {
    t: "Sem deslocamento",
    d: "Você atende de casa, do trabalho ou de qualquer lugar com internet, no Brasil ou fora dele.",
  },
  {
    t: "Horários que cabem na rotina",
    d: "Você vê a agenda real do profissional e escolhe o horário livre que funciona para você.",
  },
  {
    t: "Você escolhe o profissional",
    d: "Compare formação, abordagem, áreas de atuação, idiomas e estilo de atendimento antes de decidir.",
  },
  {
    t: "Identificação em primeiro lugar",
    d: "Sem ranking e sem ordenação por popularidade: a escolha é sua, pelo que faz sentido para você.",
  },
  {
    t: "Trocar de profissional é normal",
    d: "Se não houver identificação, você pode escolher outro profissional a qualquer momento.",
  },
];

function Home() {
  useEffect(() => {
    track("landing_view", { page: "home" });
  }, []);

  return (
    <>
      {/* 2. Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="rise-in">
            <span className="pill">Plataforma de acompanhamento especializado</span>
            <h1 className="mt-6 text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-[3.6rem]">
              Conectando pacientes aos melhores profissionais com experiência em TOC do Brasil
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Consultas online com psicólogos e psiquiatras{" "}
              <strong className="font-semibold text-foreground">
                especializados em Transtorno Obsessivo Compulsivo
              </strong>
              , sem sair de casa e no horário que cabe na sua rotina. Você{" "}
              <strong className="font-semibold text-foreground">dá match</strong> com o
              profissional com quem mais se identifica.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/profissionais" className="btn-base btn-primary">
              Encontrar profissional com experiência em TOC
              </Link>
              <Link to="/seja-parceiro" className="btn-base btn-ghost">
                Quero ser um profissional parceiro
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

      {/* Dúvida se tem TOC */}
      <section aria-labelledby="duvida-toc" className="container-page pb-4 lg:pb-8">
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
                  Quero conversar com profissional com experiência em TOC
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



      {/* 3. Identificação */}
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
              Encontrar profissional com experiência em TOC
            </Link>
            <Link to="/entenda-o-toc" className="btn-base btn-ghost">
              Quero entender o TOC
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Você não está sozinho */}
      <section aria-labelledby="acolhimento" className="container-page py-16 lg:py-20">
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
            Aqui, você encontra informação e profissionais para dar o próximo passo com mais
            segurança.
          </p>
          <Link to="/profissionais" className="btn-base btn-primary mt-8">
                Encontrar profissional com experiência em TOC
          </Link>
        </div>
      </section>

      {/* 5. Do entendimento ao cuidado */}
      <section
        aria-labelledby="conceito"
        className="border-y border-border bg-primary text-primary-foreground"
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
                Conhecer profissionais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Como funciona */}
      <section aria-labelledby="como-funciona" className="container-page py-16 lg:py-24">
        <span className="section-label">Nossa metodologia</span>
        <h2 id="como-funciona" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
          Como funciona nossa Plataforma
        </h2>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, i) => (
            <li key={passo.titulo} className="card-soft card-soft-hover p-6">
              <span className="step-index">{i + 1}</span>
              <h3 className="mt-4 text-lg">{passo.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{passo.texto}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to="/profissionais" className="btn-base btn-primary">
            Começar agora
          </Link>
          <Link to="/como-funciona" className="btn-base btn-ghost">
            Ver detalhes de cada etapa
          </Link>
        </div>
      </section>

      {/* 7. Profissionais */}
      <section aria-labelledby="profissionais" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="section-label">Profissionais</span>
            <h2 id="profissionais" className="mt-3 text-3xl sm:text-4xl">
              Psicólogos e psiquiatras com experiência na área.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada profissional declara formação, abordagem, áreas de atuação e experiência, e a
              documentação é verificada antes da publicação do perfil. Você escolhe quem faz mais
              sentido para você: não existe ranking de popularidade nem “melhor profissional”.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PROFISSIONAIS_DEMO.slice(0, 3).map((p) => (
              <article key={p.slug} className="card-soft card-soft-hover flex flex-col p-6">
                <span className="pill self-start">{p.profissao}</span>
                <h3 className="mt-4 text-lg">{p.nome}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.registro} · {p.uf} · {p.experienciaAnos} anos declarados
                </p>
                {p.abordagem && <p className="mt-4 text-sm">{p.abordagem}</p>}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.apresentacao}
                </p>
                <p className="mt-auto pt-5 text-xs text-muted-foreground">
                  Atendimento online, por videochamada.
                </p>
                <Link
                  to="/profissionais/$slug"
                  params={{ slug: p.slug }}
                  className="btn-base btn-ghost mt-4 w-full"
                >
                  Ver perfil
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <Link to="/profissionais" className="btn-base btn-primary">
              Ver todos os profissionais
            </Link>
          </div>
        </div>
      </section>





      {/* 10. Praticidade das consultas online */}
      <section aria-labelledby="online" className="container-page py-16 lg:py-24">
        <span className="section-label">Consultas online</span>
        <h2 id="online" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
          Simples de encaixar na rotina — e a escolha é sempre sua.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {praticidade.map((b) => (
            <article key={b.t} className="card-soft card-soft-hover p-6">
              <h3 className="text-lg">{b.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
            </article>
          ))}
        </div>
        <Link to="/profissionais" className="btn-base btn-primary mt-10">
          Encontrar profissional com experiência em TOC
        </Link>
      </section>

      {/* Por que somos diferentes */}
      <section aria-labelledby="diferenciais" className="container-page py-16 lg:py-24">
        <span className="section-label">Por que somos diferentes</span>
        <h2 id="diferenciais" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
          Especialização, curadoria e uma jornada integrada.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pilares.map((p) => (
            <article key={p.titulo} className="card-soft p-7">
              <h3 className="font-display text-xl">{p.titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 14. Segurança e privacidade */}
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
              Acesso segmentado por papel: você acessa apenas os seus dados; o profissional
              acessa apenas o necessário para o atendimento.
            </li>
            <li className="card-soft p-5">
              A plataforma não realiza diagnósticos, não prescreve tratamentos e não promete
              resultados. O atendimento é de responsabilidade do profissional habilitado.
            </li>
          </ul>
        </div>
      </section>

      {/* 15. CTA final */}
      <section aria-labelledby="cta-final" className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-final" className="text-4xl leading-tight sm:text-6xl">
            Seu tratamento assertivo começa aqui.
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Encontre informação confiável e profissionais para acompanhamento relacionado ao TOC.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Encontrar profissional com experiência em TOC
            </Link>
            <Link to="/seja-parceiro" className="btn-base btn-ghost">
              Quero ser um profissional parceiro
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
