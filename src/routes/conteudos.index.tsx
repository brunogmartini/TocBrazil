import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CONTEUDOS } from "@/lib/conteudos-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/conteudos/")({
  head: () => ({
    meta: [
      { title: "Conteúdos sobre TOC: pensamentos intrusivos, rituais e tratamento | Clarea" },
      {
        name: "description",
        content:
          "Artigos educativos sobre TOC organizados por tema: pensamentos intrusivos, compulsões, checagem, contaminação, família, adolescentes e tratamento.",
      },
      { property: "og:title", content: "Conteúdos sobre TOC" },
      {
        property: "og:description",
        content:
          "Informação educativa e cuidadosa sobre TOC, sem diagnóstico e sem promessas de resultado.",
      },
      { property: "og:url", content: "/conteudos" },
    ],
    links: [{ rel: "canonical", href: "/conteudos" }],
  }),
  component: Conteudos,
});

function Conteudos() {
  const [categoria, setCategoria] = useState<string>("Todas");

  const categorias = useMemo(
    () => ["Todas", ...new Set(CONTEUDOS.map((c) => c.categoria))],
    [],
  );
  const lista = CONTEUDOS.filter((c) => categoria === "Todas" || c.categoria === categoria);

  useEffect(() => {
    track("content_view", { page: "conteudos", categoria });
  }, [categoria]);

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Conteúdos</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Conteúdo para entender o TOC</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Material educativo escrito em linguagem simples. Nenhum conteúdo aqui substitui uma
        avaliação profissional, e não oferecemos testes de autodiagnóstico.
      </p>

      <ul className="mt-8 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <li key={c}>
            <button
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={`pill transition-colors ${
                categoria === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {lista.map((c) => (
          <article key={c.slug} className="card-soft card-soft-hover flex flex-col p-6">
            <span className="section-label">{c.categoria}</span>
            <h2 className="mt-3 text-lg">{c.titulo}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.resumo}</p>
            <Link
              to="/conteudos/$slug"
              params={{ slug: c.slug }}
              className="mt-auto pt-5 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Ler ({c.leitura})
            </Link>
          </article>
        ))}
      </div>

      <div className="card-soft mt-12 p-8 text-center">
        <h2 className="text-2xl">Quer conversar com um profissional?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Você pode conhecer psicólogos e psiquiatras com atendimento online quando se sentir
          pronto.
        </p>
        <Link to="/profissionais" className="btn-base btn-primary mt-6">
          Encontrar um especialista em TOC
        </Link>
      </div>
    </div>
  );
}
