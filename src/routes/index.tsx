import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import heroImg from "@/assets/hero-paciente.jpg";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOC Brazil — encontre psicólogos com experiência em TOC" },
      {
        name: "description",
        content:
          "Busque psicólogos com experiência em TOC por abordagem, horário e valor. Agendamento e pagamento acontecem na plataforma; a consulta acontece na sala do próprio psicólogo.",
      },
      {
        property: "og:title",
        content: "TOC Brazil — encontre psicólogos com experiência em TOC",
      },
      {
        property: "og:description",
        content:
          "Plataforma de tecnologia para busca, agendamento e pagamento de consultas online com psicólogos cadastrados.",
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
            "Plataforma de tecnologia para encontrar psicólogos com experiência em TOC e agendar consultas online.",
          url: "/",
        }),
      },
    ],
  }),
  component: Home,
});

const passos = [
  {
    titulo: "Encontre um psicólogo",
    texto: "Busque profissionais através de filtros avançados de pesquisa.",
  },
  {
    titulo: "Agende uma consulta online",
    texto: "Escolha um horário livre e confirme o pagamento pela plataforma.",
  },
  {
    titulo: "Receba o link e entre na sala do seu psicólogo",
    texto:
      "A sala de videochamada é do profissional. O link fica disponível para você 15 minutos antes do horário.",
  },
];

const pilares = [
  {
    titulo: "Experiência declarada",
    texto:
      "A plataforma reúne psicólogos que declaram experiência com TOC e apresentam suas abordagens no perfil.",
  },
  {
    titulo: "Verificação de registro",
    texto:
      "Conferimos a inscrição ativa no Conselho Regional de Psicologia e os documentos de formação apresentados pelo profissional.",
  },
  {
    titulo: "Agendamento e pagamento",
    texto:
      "Você escolhe horário e paga a consulta pela plataforma. O preço exibido é o valor definido pelo psicólogo.",
  },
  {
    titulo: "Consulta fora da plataforma",
    texto:
      "A consulta acontece na sala de videochamada do próprio psicólogo, contratada e mantida por ele.",
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
    d: "Já tentou conversar sobre TOC e sentiu que precisava explicar o tema desde o início.",
  },
];

function Home() {
  useEffect(() => {
    track("landing_view", { page: "home" });
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="rise-in">
            <span className="pill">Plataforma de busca, agenda e pagamento</span>
            <h1 className="heading-hero mt-6">
              Encontre psicólogos com{" "}
              <span className="text-primary">experiência em TOC</span>{" "}
              e agende sua consulta online
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Encontre profissionais que entendem de TOC, consulte horários disponíveis e agende em poucos minutos.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/profissionais" className="btn-base btn-primary">
                Comparar perfis e horários
              </Link>
              <Link to="/como-funciona" className="btn-base btn-ghost">
                Como funciona
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

      <section aria-labelledby="como-funciona" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-24">
          <span className="section-label">Como funciona</span>
          <h2 id="como-funciona" className="heading-section mt-3 max-w-3xl">
            Busca, agendamento e pagamento em uma única plataforma
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Plataforma dedicada exclusivamente ao TOC, onde você encontra psicólogos que declaram experiência na área e escolhe com quem quer se consultar.
          </p>

          <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pilares.map((p) => (
              <article key={p.titulo} className="card-soft h-full p-7">
                <h3 className="heading-subsection">{p.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
              </article>
            ))}
          </div>

          <h3 className="heading-section mt-14">As etapas do agendamento</h3>
          <ol className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {passos.map((passo, i) => (
              <li key={passo.titulo} className="card-soft card-soft-hover flex h-full items-start gap-4 p-6">
                <span className="step-index shrink-0">{i + 1}</span>
                <div className="min-w-0 pt-1">
                  <h4 className="heading-card">{passo.titulo}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{passo.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="profissionais" className="container-page py-16 lg:py-24">
        <div className="max-w-2xl">
          <span className="section-label">Psicólogos</span>
          <h2 id="profissionais" className="heading-section mt-3">
            Psicólogos cadastrados na plataforma com experiência na área.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Aqui estão reunidos diversos profissionais da saúde mental com experiência em TOC.
          </p>
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/profissionais" className="btn-base btn-primary">
            Ver psicólogos disponíveis
          </Link>
          <Link to="/cadastro-profissional" className="btn-base btn-ghost">
            Sou psicólogo
          </Link>
        </div>
      </section>

      <section aria-labelledby="identificacao" className="border-y border-border bg-surface">
        <div className="container-page py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="section-label">Conteúdo educativo</span>
            <h2 id="identificacao" className="heading-section mt-3">
              Talvez você já reconheça alguma destas situações.
            </h2>
          </div>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {identificacao.map((item) => (
              <li key={item.t} className="card-soft p-6">
                <h3 className="heading-subsection">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Reconhecer-se nessas situações não significa ter TOC. Só um profissional habilitado pode avaliar.
          </p>
        </div>
      </section>

      <section aria-labelledby="ajuda" className="container-page py-16 lg:py-20">
        <div className="card-soft overflow-hidden p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="section-label">Informação</span>
              <h2 id="ajuda" className="heading-section mt-3">
                Como um psicólogo pode ajudar
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Um psicólogo habilitado pode escutar sua história, avaliar o que vem acontecendo e conduzir o acompanhamento que entender indicado.
              </p>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Quem avalia é sempre um psicólogo, em consulta — nenhuma ferramenta substitui essa conversa. Na TOC Brazil você encontra profissionais, marca horários e paga por aqui.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/profissionais" className="btn-base btn-primary">
                  Ver quem está disponível
                </Link>
                <Link to="/entenda-o-toc" className="btn-base btn-ghost">
                  Entender melhor o TOC
                </Link>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="rounded-2xl bg-surface p-5">
                A consulta acontece na sala do próprio psicólogo, a TOC Brazil não possui salas virtuais para atendimento psicológico.
              </li>
              <li className="rounded-2xl bg-surface p-5">
                A consulta é feita por profissional habilitado, em consulta, sem teste ou triagem pela plataforma.
              </li>
              <li className="rounded-2xl bg-surface p-5">
                O link da sala aparece na sua área pouco antes do horário marcado.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="acolhimento" className="container-page pb-4 lg:pb-8">
        <div className="card-soft mx-auto max-w-3xl p-8 text-center sm:p-12">
          <span className="section-label">Apoio para decidir</span>
          <h2 id="acolhimento" className="heading-section mt-4">
            Você pode buscar informação e escolher com calma.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Buscar ajuda pode ser difícil, especialmente quando determinados pensamentos ou comportamentos causam vergonha, medo ou confusão.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Aqui na TOC Brazil, você encontra conteúdo educativo e psicólogos cadastrados com informações para comparar antes de agendar.
          </p>
          <Link to="/entenda-o-toc" className="mt-8 inline-flex font-semibold text-primary underline underline-offset-4">
            Entender melhor o TOC
          </Link>
        </div>
      </section>

      <section aria-labelledby="conceito" className="mt-16 border-y border-border bg-primary text-primary-foreground">
        <div className="container-page py-20 lg:py-28">
          <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/70">
            Plataforma de tecnologia
          </p>
          <h2 id="conceito" className="heading-section mt-4 max-w-3xl">
            Do entendimento à consulta com psicólogo.
          </h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 text-lg leading-relaxed text-primary-foreground/85">
              <p>Talvez você tenha chegado aqui procurando uma resposta.</p>
              <p>Talvez tenha visto um conteúdo no Instagram.</p>
              <p>Talvez esteja tentando entender pensamentos, dúvidas ou comportamentos que vêm ocupando espaço demais na sua vida.</p>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-primary-foreground/85">
              <p className="font-display text-2xl text-primary-foreground">
                Informação ajuda, mas não substitui uma consulta.
              </p>
              <p>Escolha um psicólogo cadastrado na plataforma e veja os horários disponíveis.</p>
              <Link to="/profissionais" className="btn-base mt-2 bg-background text-foreground hover:bg-background/90">
                Escolher um psicólogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="seguranca" className="border-y border-border bg-surface">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="section-label">Segurança e privacidade</span>
            <h2 id="seguranca" className="heading-section mt-3">
              Dados pessoais exigem cuidado redobrado.
            </h2>
            <Link to="/seguranca" className="btn-base btn-ghost mt-8">
              Como protegemos seus dados
            </Link>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li className="card-soft p-5">
              Coletamos apenas os dados necessários para agendamento, pagamento e documentação fiscal, seguindo os princípios da LGPD.
            </li>
            <li className="card-soft p-5">
              A TOC Brazil não hospeda a videochamada e não tem acesso ao conteúdo das consultas. A sala é do profissional.
            </li>
            <li className="card-soft p-5">
              Acesso segmentado por papel. O psicólogo com quem você marcou consulta vê apenas seus dados de contato, os agendamentos feitos com ele e o contato de emergência que você informou. Ninguém mais vê seus dados.
            </li>
            <li className="card-soft p-5">
              E ninguém acessa o conteúdo das consultas — elas acontecem fora da plataforma. Os documentos enviados pelos psicólogos no credenciamento ficam restritos a quem faz essa conferência.
            </li>
            <li className="card-soft p-5">
              Quem avalia é sempre um psicólogo, em consulta. A TOC Brazil não presta serviço de saúde. A consulta é de responsabilidade do psicólogo habilitado.
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="cta-final" className="container-page py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-final" className="heading-hero">
            Encontre um psicólogo e agende sua consulta.
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Busque perfis cadastrados, compare horários e confirme o pagamento em um só lugar.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Comparar perfis e horários
            </Link>
            <Link to="/cadastro-profissional" className="btn-base btn-ghost">
              Sou psicólogo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
