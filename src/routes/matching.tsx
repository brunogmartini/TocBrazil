import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PROFISSIONAIS_DEMO, formatarPreco } from "@/lib/profissionais-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/matching")({
  head: () => ({
    meta: [
      { title: "Matching por preferências: encontre um profissional | TOC Brazil" },
      {
        name: "description",
        content:
          "Responda perguntas sobre investimento, horários, profissão, idioma e estilo de atendimento e veja profissionais compatíveis com suas preferências.",
      },
      { property: "og:title", content: "Encontre um profissional que combine com você" },
      {
        property: "og:description",
        content:
          "Matching baseado apenas em preferências declaradas e disponibilidade. Não é avaliação clínica.",
      },
      { property: "og:url", content: "/matching" },
    ],
    links: [{ rel: "canonical", href: "/matching" }],
  }),
  component: Matching,
});

type Respostas = {
  profissao: string;
  investimento: string;
  idioma: string;
  genero: string;
  estilo: string;
  didatico: string;
};

const INDIFERENTE = "Indiferente";

const perguntas: {
  chave: keyof Respostas;
  titulo: string;
  ajuda: string;
  opcoes: string[];
}[] = [
  {
    chave: "profissao",
    titulo: "Você prefere começar com qual profissional?",
    ajuda: "Psicólogos conduzem psicoterapia; psiquiatras são médicos e fazem acompanhamento clínico.",
    opcoes: [INDIFERENTE, "Psicólogo(a)", "Psiquiatra"],
  },
  {
    chave: "investimento",
    titulo: "Qual faixa de investimento por sessão faz sentido agora?",
    ajuda: "Você pode mudar isso depois na busca completa.",
    opcoes: [INDIFERENTE, "Até R$ 200", "Até R$ 300", "Até R$ 500"],
  },
  {
    chave: "idioma",
    titulo: "Em qual idioma você prefere ser atendido?",
    ajuda: "Consideramos os idiomas declarados pelo profissional.",
    opcoes: [INDIFERENTE, "Português", "Inglês", "Espanhol"],
  },
  {
    chave: "genero",
    titulo: "Você tem preferência de gênero do profissional?",
    ajuda: "Essa informação é opcional e usada apenas para ordenar os resultados.",
    opcoes: [INDIFERENTE, "Feminino", "Masculino"],
  },
  {
    chave: "estilo",
    titulo: "Que estilo de atendimento parece combinar mais com você?",
    ajuda: "Mais estruturado costuma envolver plano e etapas; mais exploratório, uma escuta mais aberta.",
    opcoes: [INDIFERENTE, "Mais estruturado", "Mais exploratório"],
  },
  {
    chave: "didatico",
    titulo: "Você gostaria de um profissional que explica o processo com detalhes?",
    ajuda: "Alguns profissionais declaram um estilo mais didático ao longo do acompanhamento.",
    opcoes: [INDIFERENTE, "Sim, prefiro explicações", "Não é essencial"],
  },
];

const tetos: Record<string, number> = {
  "Até R$ 200": 20000,
  "Até R$ 300": 30000,
  "Até R$ 500": 50000,
};

function Matching() {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({
    profissao: INDIFERENTE,
    investimento: INDIFERENTE,
    idioma: INDIFERENTE,
    genero: INDIFERENTE,
    estilo: INDIFERENTE,
    didatico: INDIFERENTE,
  });
  const concluido = passo >= perguntas.length;

  useEffect(() => {
    track("matching_started", {});
  }, []);

  useEffect(() => {
    if (concluido) track("matching_completed", respostas);
  }, [concluido, respostas]);

  const pontuados = PROFISSIONAIS_DEMO.map((p) => {
    let pontos = 0;
    if (respostas.profissao !== INDIFERENTE && p.profissao === respostas.profissao) pontos += 3;
    const teto = tetos[respostas.investimento];
    if (teto && p.precoCentavos <= teto) pontos += 2;
    if (respostas.idioma !== INDIFERENTE && p.idiomas.includes(respostas.idioma)) pontos += 2;
    if (respostas.genero !== INDIFERENTE && p.genero === respostas.genero) pontos += 1;
    if (respostas.estilo !== INDIFERENTE && p.estilo === respostas.estilo) pontos += 2;
    if (respostas.didatico === "Sim, prefiro explicações" && p.didatico) pontos += 1;
    return { p, pontos };
  })
    .sort((a, b) => b.pontos - a.pontos || a.p.nome.localeCompare(b.p.nome))
    .slice(0, 4);

  const pergunta = perguntas[passo];

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Matching por preferências</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">
        {concluido ? "Profissionais que podem combinar com você" : "Algumas perguntas rápidas"}
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Consideramos apenas preferências declaradas, disponibilidade e informações dos perfis.
        Isto não é avaliação clínica, não indica diagnóstico e não sugere que um profissional é
        melhor do que outro.
      </p>

      {!concluido && pergunta && (
        <div className="card-soft mt-10 max-w-2xl p-7">
          <p className="section-label">
            Pergunta {passo + 1} de {perguntas.length}
          </p>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={passo + 1}
            aria-valuemin={1}
            aria-valuemax={perguntas.length}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((passo + 1) / perguntas.length) * 100}%` }}
            />
          </div>

          <h2 className="mt-6 text-xl">{pergunta.titulo}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{pergunta.ajuda}</p>

          <ul className="mt-6 grid gap-3">
            {pergunta.opcoes.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => {
                    setRespostas((r) => ({ ...r, [pergunta.chave]: o }));
                    setPasso((s) => s + 1);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  {o}
                </button>
              </li>
            ))}
          </ul>

          {passo > 0 && (
            <button
              type="button"
              onClick={() => setPasso((s) => s - 1)}
              className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Voltar
            </button>
          )}
        </div>
      )}

      {concluido && (
        <>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {pontuados.map(({ p }) => (
              <article key={p.slug} className="card-soft card-soft-hover flex flex-col p-6">
                <span className="pill self-start">{p.profissao}</span>
                <h2 className="mt-4 text-lg">{p.nome}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.registro} · {p.uf}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {p.apresentacao}
                </p>
                <p className="mt-4 text-sm font-semibold">{formatarPreco(p.precoCentavos)}</p>
                <Link
                  to="/profissionais/$slug"
                  params={{ slug: p.slug }}
                  className="btn-base btn-ghost mt-5 w-full"
                >
                  Ver perfil
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/profissionais" className="btn-base btn-primary">
              Ver todos os profissionais
            </Link>
            <button type="button" onClick={() => setPasso(0)} className="btn-base btn-ghost">
              Refazer as perguntas
            </button>
          </div>
        </>
      )}
    </div>
  );
}
