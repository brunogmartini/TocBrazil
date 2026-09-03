import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-paciente.jpg";
import { PSICOLOGOS_DEMO, formatarPreco } from "@/lib/psicologos-mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acolher — encontre um psicólogo para atendimento online" },
      {
        name: "description",
        content:
          "Conectamos você a profissionais de psicologia qualificados para atendimento online: agendamento, pagamento e consulta por videochamada em um só lugar.",
      },
      { property: "og:title", content: "Encontre um psicólogo que combina com você" },
      {
        property: "og:description",
        content:
          "Agendamento, pagamento e consulta por videochamada em um só lugar, com profissionais de psicologia habilitados.",
      },
    ],
  }),
  component: Home,
});

const passos = [
  {
    titulo: "Encontre seu profissional",
    texto: "Filtre por área de atuação, abordagem, valor, idioma e disponibilidade.",
  },
  {
    titulo: "Escolha um horário",
    texto: "Veja a agenda real do profissional e selecione o que couber na sua rotina.",
  },
  {
    titulo: "Agende e pague online",
    texto: "Checkout seguro, com confirmação da consulta após a aprovação do pagamento.",
  },
  {
    titulo: "Faça sua consulta por videochamada",
    texto: "A sessão acontece no navegador, sem instalar nada, no horário combinado.",
  },
];

const filtros = [
  "Área de atuação",
  "Abordagem teórica",
  "Faixa de preço",
  "Disponibilidade",
  "Público atendido",
  "Idioma",
  "Região/UF",
  "Experiência profissional",
];

function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="rise-in">
            <span className="pill">Psicoterapia online</span>
            <h1 className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[3.65rem]">
              Encontre um psicólogo que combina com você.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Conectamos você a profissionais de psicologia qualificados para atendimento
              online, com agendamento, pagamento e consulta em um só lugar.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/psicologos" className="btn-base btn-primary">
                Encontrar meu psicólogo
              </Link>
              <Link to="/para-psicologos" className="btn-base btn-ghost">
                Sou psicólogo
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <dt className="eyebrow">Profissionais</dt>
                <dd className="mt-1 text-sm text-foreground">
                  Cadastro com verificação de CRP e documentos
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Privacidade</dt>
                <dd className="mt-1 text-sm text-foreground">
                  Dados tratados conforme a LGPD
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Sessões</dt>
                <dd className="mt-1 text-sm text-foreground">
                  Videochamada no navegador, sem gravação
                </dd>
              </div>
            </dl>
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
          <span className="eyebrow">Como funciona</span>
          <h2 id="como-funciona" className="mt-3 max-w-2xl text-3xl sm:text-4xl">
            Quatro passos simples até a sua primeira sessão.
          </h2>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((passo, i) => (
              <li key={passo.titulo} className="card-soft card-soft-hover p-6">
                <span className="font-display text-2xl text-secondary-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg">{passo.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {passo.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="encontrar" className="container-page py-16 lg:py-24">
        <div className="max-w-2xl">
          <span className="eyebrow">Busca</span>
          <h2 id="encontrar" className="mt-3 text-3xl sm:text-4xl">
            Encontre um profissional que faça sentido para você.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cada profissional declara sua formação, abordagem e áreas de atuação, e a
            plataforma verifica a documentação antes da publicação do perfil.
          </p>
        </div>

        <ul className="mt-8 flex flex-wrap gap-2">
          {filtros.map((f) => (
            <li key={f} className="pill bg-muted text-foreground">
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PSICOLOGOS_DEMO.slice(0, 3).map((p) => (
            <article key={p.slug} className="card-soft card-soft-hover p-6">
              <h3 className="text-lg">{p.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.crp} · {p.uf}
              </p>
              <p className="mt-4 text-sm text-foreground">{p.abordagem}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p.apresentacao}
              </p>
              <p className="mt-5 text-sm font-semibold">
                {formatarPreco(p.precoCentavos)}{" "}
                <span className="font-normal text-muted-foreground">por sessão</span>
              </p>
              <Link
                to="/psicologos/$slug"
                params={{ slug: p.slug }}
                className="btn-base btn-ghost mt-5 w-full"
              >
                Ver perfil
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/psicologos" className="btn-base btn-primary">
            Ver todos os profissionais
          </Link>
        </div>
      </section>

      <section aria-labelledby="confianca" className="border-t border-border bg-surface">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="eyebrow">Segurança e responsabilidade</span>
            <h2 id="confianca" className="mt-3 text-3xl sm:text-4xl">
              Uma infraestrutura pensada para cuidado e conformidade.
            </h2>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li className="card-soft p-5">
              O atendimento psicológico é de responsabilidade do profissional habilitado. A
              plataforma não realiza diagnósticos nem prescreve tratamentos.
            </li>
            <li className="card-soft p-5">
              Coletamos apenas os dados necessários para o agendamento, o pagamento e a
              documentação fiscal, seguindo os princípios da LGPD.
            </li>
            <li className="card-soft p-5">
              As sessões não são gravadas por padrão e acontecem por videochamada segura no
              navegador.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
