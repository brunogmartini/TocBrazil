import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { CONTEUDOS } from "@/lib/conteudos-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/conteudos/$slug")({
  loader: ({ params }) => {
    const conteudo = CONTEUDOS.find((c) => c.slug === params.slug);
    if (!conteudo) throw notFound();
    return { conteudo };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Conteúdo indisponível — Clarea" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const c = loaderData.conteudo;
    return {
      meta: [
        { title: `${c.titulo} | Clarea` },
        { name: "description", content: c.resumo.slice(0, 158) },
        { property: "og:title", content: c.titulo },
        { property: "og:description", content: c.resumo.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/conteudos/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/conteudos/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: c.titulo,
            description: c.resumo,
            articleSection: c.categoria,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-20">
      <h1 className="text-3xl">Conteúdo não encontrado</h1>
      <Link to="/conteudos" className="btn-base btn-primary mt-8">
        Ver todos os conteúdos
      </Link>
    </div>
  ),
  component: Artigo,
});

function Artigo() {
  const { conteudo: c } = Route.useLoaderData();
  const relacionados = CONTEUDOS.filter((o) => o.slug !== c.slug).slice(0, 3);

  useEffect(() => {
    track("content_view", { page: "artigo", slug: c.slug, categoria: c.categoria });
  }, [c.slug, c.categoria]);

  return (
    <div className="container-page py-12 lg:py-16">
      <Link
        to="/conteudos"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Todos os conteúdos
      </Link>

      <article className="mt-6 max-w-3xl">
        <span className="section-label">{c.categoria}</span>
        <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{c.titulo}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Leitura de {c.leitura}</p>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
          {c.paragrafos.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>

        <section className="card-soft mt-10 p-6">
          <h2 className="text-base">Referências</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {c.fontes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          Este conteúdo é informativo e não constitui diagnóstico, indicação de tratamento ou
          prescrição. Somente um profissional qualificado pode avaliar cada caso.
        </p>

        <div className="card-soft mt-10 p-8">
          <h2 className="text-2xl">Quando se sentir pronto</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Conheça profissionais de Psicologia e Psiquiatria com atendimento online.
          </p>
          <Link to="/profissionais" className="btn-base btn-primary mt-6">
            Encontrar um profissional
          </Link>
        </div>
      </article>

      <section aria-labelledby="relacionados" className="mt-16">
        <h2 id="relacionados" className="text-2xl">
          Continue lendo
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {relacionados.map((r) => (
            <article key={r.slug} className="card-soft card-soft-hover flex flex-col p-6">
              <span className="section-label">{r.categoria}</span>
              <h3 className="mt-3 text-lg">{r.titulo}</h3>
              <Link
                to="/conteudos/$slug"
                params={{ slug: r.slug }}
                className="mt-auto pt-5 text-sm font-semibold underline-offset-4 hover:underline"
              >
                Ler ({r.leitura})
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
