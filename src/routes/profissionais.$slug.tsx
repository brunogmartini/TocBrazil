import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { avaliacoesDoProfissional, obterProfissional } from "@/lib/plataforma.functions";
import { Estrelas } from "@/components/estrelas";
import { track } from "@/lib/analytics";

const LABEL_PROFISSAO: Record<string, string> = {
  psicologo: "Psicólogo(a)",
  psiquiatra: "Psiquiatra",
};

export const Route = createFileRoute("/profissionais/$slug")({
  loader: async ({ params }) => {
    const { profissional } = await obterProfissional({ data: { slug: params.slug } });
    if (!profissional) throw notFound();
    const avaliacoes = await avaliacoesDoProfissional({
      data: { professionalId: profissional.id },
    });
    return { profissional, avaliacoes };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Perfil indisponível — TOC Brazil" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.profissional;
    const titulo = `${p.nome} — ${LABEL_PROFISSAO[p.profissao]} online | TOC Brazil`;
    const desc = `${p.nome} (${p.registro}) atende online. ${p.apresentacao ?? ""}`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: desc.slice(0, 158) },
        { property: "og:title", content: titulo },
        { property: "og:description", content: desc.slice(0, 158) },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
        { property: "og:url", content: `/profissionais/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/profissionais/${params.slug}` }],
    };
  },
  errorComponent: NaoEncontrado,
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
  const { profissional: p, avaliacoes } = Route.useLoaderData();

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
          <span className="pill">{LABEL_PROFISSAO[p.profissao]}</span>
          <h1 className="mt-4 text-3xl sm:text-4xl">{p.nome}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {p.registro} · {p.uf} · {p.experiencia_anos} anos de experiência declarados
          </p>

          <div className="card-soft mt-8 p-6">
            <h2 className="text-lg">Apresentação</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{p.apresentacao}</p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <section className="card-soft p-6">
              <h2 className="text-lg">Formação</h2>
              {p.graduacao && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {p.graduacao}
                  {p.instituicao ? ` — ${p.instituicao}` : ""}
                </p>
              )}
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[...p.formacao, ...(p.especializacoes ?? []), ...(p.cursos ?? [])].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>

            <section className="card-soft p-6">
              <h2 className="text-lg">Abordagem</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {p.abordagem ?? "Acompanhamento médico psiquiátrico."}
              </p>
            </section>
            <section className="card-soft p-6">
              <h2 className="text-lg">Experiência com TOC</h2>
              <p className="mt-3 text-sm text-muted-foreground">{p.experiencia_toc}</p>
            </section>
            <section className="card-soft p-6">
              <h2 className="text-lg">Subtipos e idiomas</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.areas.map((a) => (
                  <li key={a} className="pill">
                    {a}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Idiomas: {p.idiomas.join(", ")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Modalidade: online</p>
            </section>
          </div>

          <section className="card-soft mt-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg">Avaliações de pacientes</h2>
              {avaliacoes.total > 0 && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Estrelas nota={avaliacoes.media} />
                  {avaliacoes.media.toFixed(1)} · {avaliacoes.total}{" "}
                  {avaliacoes.total === 1 ? "avaliação" : "avaliações"}
                </span>
              )}
            </div>
            {avaliacoes.total === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Este profissional ainda não recebeu avaliações. Depois da consulta, você pode dar
                até 5 estrelas na sua área.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {avaliacoes.avaliacoes.map((a) => (
                  <li key={a.id} className="rounded-xl bg-muted p-4 text-sm">
                    <Estrelas nota={a.nota} />
                    {a.comentario && <p className="mt-2 text-muted-foreground">{a.comentario}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            As informações deste perfil são declaradas pelo profissional e sua documentação é
            verificada pela plataforma. A TOC Brazil não realiza diagnósticos, não prescreve
            tratamentos e não promete resultados.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft p-6">
            <p className="text-lg">Sessão de {p.slot_minutos} minutos, online</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Os horários livres e o valor da consulta aparecem depois que você cria sua conta.
            </p>
            <Link
              to="/agendar/$slug"
              params={{ slug: p.slug }}
              className="btn-base btn-primary mt-6 w-full"
              onClick={() => track("schedule_started", { slug: p.slug })}
            >
              Ver horários e agendar
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              A consulta é confirmada após a aprovação do pagamento. Cancelamento sem custo até 24
              horas antes do horário marcado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
