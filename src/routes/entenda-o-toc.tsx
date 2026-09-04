import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CONTEUDOS } from "@/lib/conteudos-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/entenda-o-toc")({
  head: () => ({
    meta: [
      { title: "Sobre o transtorno: obsessões, compulsões e como buscar cuidado | TOC Brazil" },
      {
        name: "description",
        content:
          "O que caracteriza o Transtorno Obsessivo-Compulsivo, como ele se manifesta de formas diferentes e por que apenas um profissional qualificado pode avaliar.",
      },
      { property: "og:title", content: "Sobre o transtorno em linguagem simples" },
      {
        property: "og:description",
        content:
          "Conteúdo educativo sobre obsessões, compulsões, checagem e tratamento — sem diagnóstico e sem promessas.",
      },
      { property: "og:url", content: "/entenda-o-toc" },
    ],
    links: [{ rel: "canonical", href: "/entenda-o-toc" }],
  }),
  component: EntendaOToc,
});

const blocos = [
  {
    t: "Obsessões",
    d: "Pensamentos, imagens ou impulsos indesejados e repetitivos, que costumam contrariar aquilo que a pessoa valoriza.",
  },
  {
    t: "Compulsões",
    d: "Comportamentos ou rituais mentais realizados para reduzir o desconforto — verificar, lavar, repetir, contar, revisar na memória.",
  },
  {
    t: "O ciclo",
    d: "O alívio imediato tende a reforçar o comportamento, o que pode aumentar o tempo e as regras envolvidas ao longo do tempo.",
  },
  {
    t: "Interferência",
    d: "O que costuma ser considerado clinicamente é o sofrimento envolvido e o quanto isso interfere na rotina da pessoa.",
  },
];

function EntendaOToc() {
  useEffect(() => {
    track("content_view", { page: "entenda-o-toc" });
  }, []);

  return (
    <>
      <section className="container-page py-14 lg:py-20">
        <span className="section-label">Conteúdo educativo</span>
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight sm:text-5xl">
          Sobre o transtorno: entenda antes de decidir qualquer próximo passo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Reunimos informação clara sobre o Transtorno Obsessivo-Compulsivo para que você possa
          entender melhor o que vem acontecendo. Nada aqui é diagnóstico: apenas um profissional
          qualificado pode avaliar.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/conteudos" className="btn-base btn-primary">
            Ver conteúdos
          </Link>
          <Link to="/profissionais" className="btn-base btn-ghost">
            Encontrar um especialista
          </Link>
        </div>
      </section>

      <section aria-labelledby="fundamentos" className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 id="fundamentos" className="text-2xl sm:text-3xl">
            Como o TOC costuma ser descrito
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {blocos.map((b) => (
              <article key={b.t} className="card-soft p-6">
                <h3 className="text-lg">{b.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Cada pessoa vivencia o TOC de forma diferente. Alguns rituais são visíveis, outros
            acontecem apenas mentalmente. Ter um pensamento intrusivo isolado é uma experiência
            comum e não caracteriza, por si só, um transtorno.
          </p>
        </div>
      </section>

      <section aria-labelledby="leituras" className="container-page py-14 lg:py-20">
        <h2 id="leituras" className="text-2xl sm:text-3xl">
          Leituras para começar
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CONTEUDOS.map((c) => (
            <article key={c.slug} className="card-soft card-soft-hover flex flex-col p-6">
              <span className="section-label">{c.categoria}</span>
              <h3 className="mt-3 text-lg">{c.titulo}</h3>
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
      </section>

      <section className="border-t border-border bg-surface">
        <div className="container-page py-14 text-center lg:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl sm:text-4xl">
            Quando fizer sentido para você, o próximo passo está aqui.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Conheça profissionais de Psicologia e Psiquiatria com atendimento online.
          </p>
          <Link to="/profissionais" className="btn-base btn-primary mt-8">
            Encontrar um especialista
          </Link>
        </div>
      </section>
    </>
  );
}
