import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import heroImg from "@/assets/hero-paciente.jpg";
import { PROFISSIONAIS_DEMO, formatarPreco } from "@/lib/profissionais-mock";
import { CONTEUDOS } from "@/lib/conteudos-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clarea — entenda o TOC e encontre o cuidado certo" },
      {
        name: "description",
        content:
          "Plataforma especializada em TOC: informação confiável e acesso a profissionais de Psicologia e Psiquiatria para quem busca acompanhamento, com agenda, pagamento e videochamada.",
      },
      { property: "og:title", content: "Entenda o TOC. Encontre o cuidado certo." },
      {
        property: "og:description",
        content:
          "Informação confiável e acesso a profissionais de Psicologia e Psiquiatria para quem busca acompanhamento relacionado ao TOC.",
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
          name: "Clarea",
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
  { titulo: "Entenda", texto: "Aprenda sobre TOC através de conteúdos educativos." },
  { titulo: "Encontre", texto: "Conheça profissionais e suas áreas de atuação." },
  { titulo: "Escolha", texto: "Encontre alguém que combine com suas preferências." },
  { titulo: "Agende", texto: "Escolha um horário e faça o pagamento online." },
  { titulo: "Comece", texto: "Realize sua consulta por videochamada." },
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

const beneficiosPaciente = [
  { t: "Informação primeiro", d: "Conteúdo educativo sobre TOC antes de qualquer decisão." },
  { t: "Escolha sua", d: "Filtros por preferências, não ranking de popularidade." },
  { t: "Agenda real", d: "Você vê os horários disponíveis do profissional." },
  { t: "Pagamento online", d: "Cartão ou Pix, com confirmação da consulta." },
  { t: "Consulta no navegador", d: "Videochamada sem instalar nada e sem links externos." },
  { t: "Tudo em um lugar", d: "Histórico, documentos e reagendamentos na sua área." },
];

const beneficiosProfissional = [
  { t: "Mais visibilidade", d: "Apresente seu trabalho para pessoas que já estão buscando cuidado." },
  { t: "Agenda", d: "Defina seus horários e deixe a plataforma organizar os agendamentos." },
  { t: "Pagamentos", d: "Uma experiência simples para receber pelos atendimentos." },
  { t: "Videochamada", d: "Atenda online sem precisar enviar links externos." },
  { t: "Financeiro", d: "Acompanhe consultas, pagamentos, taxas e repasses." },
  { t: "Tecnologia", d: "Uma infraestrutura completa para sua prática online." },
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
            <span className="pill">Plataforma especializada em TOC</span>
            <h1 className="mt-6 text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-[3.6rem]">
              Entenda o TOC. Encontre o cuidado certo.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Informação confiável e acesso a profissionais de Psicologia e Psiquiatria para quem
              busca acompanhamento relacionado ao TOC.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/profissionais" className="btn-base btn-primary">
              Encontrar um especialista em TOC
              </Link>
              <Link to="/entenda-o-toc" className="btn-base btn-ghost">
                Quero entender melhor o TOC
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Uma plataforma especializada em conectar pessoas a profissionais de saúde mental.
            </p>
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

      {/* 3. Identificação */}
      <section aria-labelledby="identificacao" className="border-y border-border bg-surface">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <span className="section-label">Identificação</span>
            <h2 id="identificacao" className="mt-3 text-3xl sm:text-4xl">
              O TOC nem sempre é fácil de explicar.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              Pensamentos intrusivos, dúvidas que parecem não ter fim, necessidade de verificar,
              evitar ou buscar garantias. Cada pessoa pode vivenciar o TOC de uma maneira
              diferente.
            </p>
            <p>
              Encontrar informação confiável e um profissional com experiência adequada pode ser
              um passo importante para buscar cuidado.
            </p>
            <Link to="/profissionais" className="btn-base btn-ghost">
              Conhecer profissionais
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
            Encontrar um profissional
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
              <p>
                Comece pela informação. Quando fizer sentido para você, encontre um
                profissional.
              </p>
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
        <span className="section-label">Como funciona</span>
        <h2 id="como-funciona" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
          Cinco passos, do primeiro conteúdo até a sua consulta.
        </h2>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
              Psicólogos e psiquiatras com informações claras.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada profissional declara formação, abordagem, áreas de atuação e experiência, e a
              documentação é verificada antes da publicação do perfil. Não há ranking de
              popularidade nem indicação de “melhor profissional”.
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
                <p className="mt-auto pt-5 text-sm font-semibold">
                  {formatarPreco(p.precoCentavos)}{" "}
                  <span className="font-normal text-muted-foreground">por sessão</span>
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

      {/* 8. Matching */}
      <section aria-labelledby="matching" className="container-page py-16 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="section-label">Matching</span>
            <h2 id="matching" className="mt-3 text-3xl sm:text-4xl">
              Encontre um profissional que combine com você.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Responda a algumas perguntas simples sobre suas preferências — faixa de
              investimento, horários, profissão, idioma e estilo de atendimento — e veja
              profissionais que podem fazer sentido para você.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              O resultado considera apenas preferências, disponibilidade e informações declaradas
              pelos profissionais. Não é avaliação clínica e não indica diagnóstico.
            </p>
            <Link to="/matching" className="btn-base btn-primary mt-8">
              Começar o matching
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {["Faixa de investimento", "Horários possíveis", "Psicólogo ou psiquiatra", "Preferência de gênero", "Idioma", "Estilo de atendimento"].map(
              (item) => (
                <li key={item} className="card-soft p-5 text-sm">
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* 9. Conteúdo */}
      <section aria-labelledby="conteudo" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-24">
          <span className="section-label">Conteúdos</span>
          <h2 id="conteudo" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
            Conteúdo para entender o TOC.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {CONTEUDOS.slice(0, 3).map((c) => (
              <article key={c.slug} className="card-soft card-soft-hover flex flex-col p-6">
                <span className="section-label">{c.categoria}</span>
                <h3 className="mt-3 text-lg">{c.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.resumo}</p>
                <Link
                  to="/conteudos/$slug"
                  params={{ slug: c.slug }}
                  className="mt-auto pt-5 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Ler ({c.leitura})
                </Link>
              </article>
            ))}
          </div>
          <Link to="/conteudos" className="btn-base btn-ghost mt-10">
            Ver todos os conteúdos
          </Link>
        </div>
      </section>

      {/* 10. Benefícios para pacientes */}
      <section aria-labelledby="pacientes" className="container-page py-16 lg:py-24">
        <span className="section-label">Para pacientes</span>
        <h2 id="pacientes" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
          Uma jornada pensada para reduzir a fricção.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {beneficiosPaciente.map((b) => (
            <article key={b.t} className="card-soft card-soft-hover p-6">
              <h3 className="text-lg">{b.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 11-13. Benefícios e páginas para profissionais */}
      <section aria-labelledby="profissionais-beneficios" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-24">
          <span className="section-label">Para profissionais</span>
          <h2 id="profissionais-beneficios" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
            Você cuida do paciente. Nós cuidamos da infraestrutura.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Faça parte de uma rede especializada em conectar profissionais a pessoas que procuram
            acompanhamento relacionado ao TOC.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {beneficiosProfissional.map((b) => (
              <article key={b.t} className="card-soft card-soft-hover p-6">
                <h3 className="text-lg">{b.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/para-psicologos" className="btn-base btn-primary">
              Sou psicólogo
            </Link>
            <Link to="/para-psiquiatras" className="btn-base btn-ghost">
              Sou psiquiatra
            </Link>
          </div>
        </div>
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
          <h2 id="cta-final" className="text-3xl sm:text-5xl">
            Seu próximo passo pode começar aqui.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Encontre informação confiável e profissionais para acompanhamento relacionado ao TOC.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Encontrar um profissional
            </Link>
            <Link to="/entenda-o-toc" className="btn-base btn-ghost">
              Quero entender o TOC
            </Link>
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row">
            <span className="text-muted-foreground">Para profissionais:</span>
            <Link to="/para-psicologos" className="font-semibold underline-offset-4 hover:underline">
              Sou psicólogo
            </Link>
            <Link to="/para-psiquiatras" className="font-semibold underline-offset-4 hover:underline">
              Sou psiquiatra
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
