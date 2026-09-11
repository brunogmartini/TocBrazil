import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
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
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
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

const subtipos = [
  {
    t: "TOC de simetria",
    d: "Pode envolver uma necessidade intensa de alinhamento, equilíbrio ou sensação de que algo está exatamente certo.",
  },
  {
    t: "TOC de falsas memórias",
    d: "Dúvidas persistentes sobre algo que pode ter acontecido levam a revisões mentais e buscas repetidas por confirmação.",
  },
  {
    t: "TOC de orientação sexual",
    d: "Obsessões e dúvidas indesejadas sobre orientação sexual podem provocar checagens, comparações e busca de certeza.",
  },
  {
    t: "TOC de contaminação e limpeza",
    d: "Medos de sujeira, germes ou contaminação podem estar associados a lavagens, limpezas e evitações repetitivas.",
  },
  {
    t: "TOC religioso ou escrupulosidade",
    d: "Preocupações excessivas com moralidade, culpa, pecado ou práticas religiosas podem alimentar rituais e pedidos de garantia.",
  },
  {
    t: "TOC de relacionamento",
    d: "Dúvidas recorrentes sobre sentimentos, compatibilidade ou a qualidade de um vínculo podem ocupar muito tempo e gerar checagens.",
  },
  {
    t: "TOC puro",
    d: "Expressão comum para quadros em que as compulsões são principalmente mentais, como ruminar, neutralizar ou revisar pensamentos.",
  },
  {
    t: "TOC existencial",
    d: "Questões sobre realidade, identidade, sentido da vida ou existência podem se tornar dúvidas repetitivas e angustiantes.",
  },
  {
    t: "TOC de organização",
    d: "A necessidade de organizar segundo regras rígidas pode gerar sofrimento quando objetos ou tarefas não ficam na ordem esperada.",
  },
  {
    t: "TOC de dúvida e checagem",
    d: "A incerteza sobre portas, aparelhos, mensagens ou ações pode levar a verificações repetidas que não encerram a dúvida.",
  },
  {
    t: "TOC sexual",
    d: "Pensamentos ou imagens sexuais intrusivos e indesejados podem causar medo, vergonha e tentativas constantes de obter certeza.",
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
        <h1 className="heading-page mt-4 max-w-3xl">
          Entendendo o transtorno
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Reunimos informação clara sobre o Transtorno Obsessivo-Compulsivo para que você possa
          entender melhor o que vem acontecendo. Nada aqui é diagnóstico: apenas um profissional
          qualificado pode avaliar.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/profissionais" className="btn-base btn-ghost">
            Ver profissionais
          </Link>
        </div>
      </section>

      <section aria-labelledby="fundamentos" className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 id="fundamentos" className="heading-section">
            Como o TOC costuma ser descrito
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {blocos.map((b) => (
              <article key={b.t} className="card-soft p-6">
                <h3 className="heading-subsection">{b.t}</h3>
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

      <section aria-labelledby="subtipos" className="container-page py-14 lg:py-20">
        <div className="max-w-3xl">
          <span className="section-label">Manifestações do TOC</span>
          <h2 id="subtipos" className="heading-section mt-3">
            Conheça alguns subtipos do transtorno
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            O TOC pode se manifestar por temas diferentes, e uma mesma pessoa pode vivenciar mais
            de um deles. Os nomes abaixo ajudam a descrever experiências frequentes, mas não
            substituem uma avaliação individual feita por profissional qualificado.
          </p>
        </div>
        <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subtipos.map((subtipo) => (
            <article key={subtipo.t} className="card-soft h-full p-6">
              <h3 className="heading-subsection">{subtipo.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtipo.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="container-page py-14 text-center lg:py-20">
          <h2 className="heading-section mx-auto max-w-2xl">
            Quando fizer sentido para você, o próximo passo está aqui.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Conheça profissionais de Psicologia e Psiquiatria com atendimento online.
          </p>
          <Link to="/profissionais" className="btn-base btn-primary mt-8">
            Ver profissionais
          </Link>
        </div>
      </section>
    </>
  );
}
