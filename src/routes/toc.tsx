import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-paciente.jpg";
import { PSICOLOGOS_DEMO, formatarPreco } from "@/lib/psicologos-mock";

export const Route = createFileRoute("/toc")({
  head: () => ({
    meta: [
      { title: "Atendimento online em TOC — Acolher" },
      {
        name: "description",
        content:
          "Encontre um psicólogo para começar seu acompanhamento online. Profissionais que declaram atuação em TOC, com agendamento e sessões por videochamada.",
      },
      { property: "og:title", content: "Atendimento online em TOC" },
      {
        property: "og:description",
        content:
          "Encontre um psicólogo para começar seu acompanhamento online, com agendamento e sessões por videochamada.",
      },
    ],
  }),
  component: Toc,
});

function Toc() {
  const profissionais = PSICOLOGOS_DEMO.filter((p) => p.areas.includes("TOC"));

  return (
    <>
      <section className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div className="rise-in">
          <span className="pill">TOC · atendimento online</span>
          <h1 className="mt-6 text-3xl leading-tight sm:text-5xl">
            Encontre um psicólogo para começar seu acompanhamento online.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Profissionais habilitados que declaram atuação em TOC, com horários, valores e
            informações claras antes de você agendar.
          </p>
          <Link to="/psicologos" className="btn-base btn-primary mt-8">
            Encontrar um profissional
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            As áreas de atuação são declaradas por cada profissional. A plataforma não afirma
            especialidade que não possa ser verificada e não realiza diagnósticos.
          </p>
        </div>
        <img
          src={heroImg}
          alt="Pessoa em um momento tranquilo, sentada perto de uma janela"
          loading="lazy"
          width={1408}
          height={1600}
          className="w-full rounded-[2rem] object-cover shadow-[var(--shadow-soft)]"
        />
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 className="text-2xl sm:text-3xl">O que você encontra aqui</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                t: "Informação clara",
                d: "Abordagem, formação, valor da sessão e política de cancelamento visíveis no perfil.",
              },
              {
                t: "Agenda real",
                d: "Horários disponíveis atualizados, sem risco de duplicidade de agendamento.",
              },
              {
                t: "Sessão no navegador",
                d: "Videochamada segura, sem instalar aplicativos e sem gravação por padrão.",
              },
            ].map((i) => (
              <li key={i.t} className="card-soft p-6">
                <h3 className="text-lg">{i.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-14 lg:py-20">
        <h2 className="text-2xl sm:text-3xl">Profissionais com atuação declarada em TOC</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {profissionais.map((p) => (
            <article key={p.slug} className="card-soft card-soft-hover p-6">
              <h3 className="text-lg">{p.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.crp} · {p.uf}
              </p>
              <p className="mt-3 text-sm">{p.abordagem}</p>
              <p className="mt-4 text-sm font-semibold">{formatarPreco(p.precoCentavos)}</p>
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
      </section>
    </>
  );
}
