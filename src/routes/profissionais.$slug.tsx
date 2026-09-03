import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PROFISSIONAIS_DEMO } from "@/lib/profissionais-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/profissionais/$slug")({
  loader: ({ params }) => {
    const profissional = PROFISSIONAIS_DEMO.find((p) => p.slug === params.slug);
    if (!profissional) throw notFound();
    return { profissional };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Perfil indisponível — TOC Brazil" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.profissional;
    const titulo = `${p.nome} — ${p.profissao} online | TOC Brazil`;
    const desc = `${p.nome} (${p.registro}) atende online. ${p.apresentacao}`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc.slice(0, 158) },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc.slice(0, 158) },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `/profissionais/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/profissionais/${params.slug}` }],
    };
  },
  notFoundComponent: NaoEncontrado,
  component: Perfil,
});

function NaoEncontrado() {
  return (
    <div className="container-page py-20">
      <h1 className="text-3xl">Perfil não encontrado</h1>
      <p className="mt-4 text-muted-foreground">
        Este perfil pode ter sido despublicado ou o endereço está incorreto.
      </p>
      <Link to="/profissionais" className="btn-base btn-primary mt-8">
        Ver profissionais
      </Link>
    </div>
  );
}

function Perfil() {
  const { profissional: p } = Route.useLoaderData();
  const [horario, setHorario] = useState<string | null>(null);

  useEffect(() => {
    track("professional_profile_view", { slug: p.slug, profissao: p.profissao });
  }, [p.slug, p.profissao]);

  return (
    <div className="container-page py-12 lg:py-16">
      <Link
        to="/profissionais"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Voltar para a busca
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <span className="pill">{p.profissao}</span>
          <h1 className="mt-4 text-3xl sm:text-4xl">{p.nome}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {p.registro} · {p.uf} · {p.experienciaAnos} anos de experiência declarados
          </p>

          <div className="card-soft mt-8 p-6">
            <h2 className="text-lg">Apresentação</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{p.apresentacao}</p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <section className="card-soft p-6">
              <h2 className="text-lg">Formação</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {p.formacao.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
            <section className="card-soft p-6">
              <h2 className="text-lg">Abordagem</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {p.abordagem ?? "Acompanhamento médico psiquiátrico (sem abordagem psicoterápica)."}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Estilo declarado: {p.estilo.toLowerCase()}
                {p.didatico ? ", com explicações didáticas ao longo do processo." : "."}
              </p>
            </section>
            <section className="card-soft p-6">
              <h2 className="text-lg">Áreas de atuação</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.areas.map((a) => (
                  <li key={a} className="pill">
                    {a}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card-soft p-6">
              <h2 className="text-lg">Atendimento</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Público: {p.publicos.join(", ")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Idiomas: {p.idiomas.join(", ")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Modalidade: online</p>
            </section>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            As informações deste perfil são declaradas pelo profissional e sua documentação é
            verificada pela plataforma. A TOC Brazil não realiza diagnósticos, não prescreve
            tratamentos e não promete resultados.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft p-6">
            <p className="text-lg">Sessão de 50 minutos, online</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Valores e formas de pagamento ficam disponíveis após o cadastro na plataforma.
            </p>

            <h2 className="section-label mt-7">Próximos horários</h2>
            <ul className="mt-3 grid gap-2">
              {p.horarios.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    aria-pressed={horario === h}
                    onClick={() => {
                      setHorario(h);
                      track("schedule_started", { slug: p.slug, horario: h });
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      horario === h
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={!horario}
              onClick={() => track("checkout_started", { slug: p.slug, horario })}
              className="btn-base btn-primary mt-6 w-full disabled:opacity-50"
            >
              {horario ? `Agendar ${horario}` : "Escolha um horário"}
            </button>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              O agendamento é confirmado após a aprovação do pagamento. O checkout ainda não está
              conectado a um provedor de pagamentos nesta versão.
            </p>
            <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              {p.politicaCancelamento}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
