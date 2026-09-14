import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listarProfissionais } from "@/lib/plataforma.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/profissionais/")({
  loader: () => listarProfissionais(),
  head: () => ({
    meta: [
      { title: "Encontrar psicólogo ou psiquiatra online — TOC Brazil" },
      {
        name: "description",
        content:
          "Compare perfis de psicólogos e psiquiatras por profissão, abordagem, subtipo de TOC, idioma e experiência para atendimento online.",
      },
      { property: "og:title", content: "Encontre profissional com experiência em TOC" },
      {
        property: "og:description",
        content:
          "Filtros por preferências, informações declaradas e verificadas, sem ranking de popularidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/profissionais" },
    ],
    links: [{ rel: "canonical", href: "/profissionais" }],
  }),
  errorComponent: () => (
    <div className="container-page py-20">
      <h1 className="heading-page">Não conseguimos carregar os profissionais</h1>
      <p className="mt-4 text-muted-foreground">Atualize a página em alguns instantes.</p>
    </div>
  ),
  component: Busca,
});

const TODOS = "Todos";
export const ABORDAGEM_EPR = "Exposição e Prevenção de Resposta (EPR)";
export const LABEL_PROFISSAO: Record<string, string> = {
  psicologo: "Psicólogo(a)",
  psiquiatra: "Psiquiatra",
};

function Busca() {
  const { profissionais } = Route.useLoaderData();
  const [profissao, setProfissao] = useState(TODOS);
  const [abordagem, setAbordagem] = useState(TODOS);
  const [idioma, setIdioma] = useState(TODOS);
  const [genero, setGenero] = useState(TODOS);

  const abordagens = useMemo(
    () => [
      TODOS,
      ...new Set([
        ABORDAGEM_EPR,
        "Terapia Cognitivo Comportamental",
        "Psicanálise",
        ...profissionais.map((p) => p.abordagem).filter((a): a is string => !!a),
      ]),
    ],
    [profissionais],
  );
  const idiomas = useMemo(
    () => [TODOS, "Português", "Espanhol", "Inglês"],
    [],
  );

  const resultados = useMemo(
    () =>
      profissionais
        .filter(
          (p) =>
            (profissao === TODOS || LABEL_PROFISSAO[p.profissao] === profissao) &&
            (abordagem === TODOS || p.abordagem === abordagem) &&
            (idioma === TODOS || p.idiomas.includes(idioma)) &&
            (genero === TODOS || p.genero === genero.toLowerCase()),
        )
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [profissionais, profissao, abordagem, idioma, genero],
  );

  useEffect(() => {
    track("professional_search", {
      profissao,
      abordagem,
      idioma,
      genero,
      resultados: resultados.length,
    });
  }, [profissao, abordagem, idioma, genero, resultados.length]);


  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Profissionais</span>
      <h1 className="heading-page mt-3">Encontre profissional com experiência em TOC</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        As informações são declaradas pelos profissionais e a documentação é verificada pela
        plataforma. A ordenação é neutra: não indicamos que um profissional é melhor do que outro.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Somente perfis com documentação verificada e aprovados pela nossa equipe aparecem aqui.
      </p>


      <form
        className="card-soft mt-8 grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Profissionais"
          value={profissao}
          onChange={setProfissao}
          options={[TODOS, "Psicólogo(a)", "Psiquiatra"]}
        />
        <Select
          label="Abordagem teórica"
          value={abordagem}
          onChange={setAbordagem}
          options={abordagens}
        />
        <Select label="Idioma" value={idioma} onChange={setIdioma} options={idiomas} />
        <Select
          label="Gênero (quando informado)"
          value={genero}
          onChange={setGenero}
          options={[TODOS, "Feminino", "Masculino"]}
        />

      </form>

      <p className="mt-8 text-sm text-muted-foreground" role="status">
        {resultados.length} profissional(is) — todos com atendimento online
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {resultados.map((p) => (
          <article key={p.slug} className="card-soft card-soft-hover flex h-full flex-col p-6">
            <span className="pill self-start">{LABEL_PROFISSAO[p.profissao]}</span>
            <h2 className="mt-4 text-lg">{p.nome}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.registro} · {p.uf} · {p.experiencia_anos} anos declarados
            </p>
            {p.abordagem && <p className="mt-4 text-sm">{p.abordagem}</p>}
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.areas.map((a) => (
                <li key={a} className="pill">
                  {a}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.apresentacao}</p>
            <p className="mt-4 text-xs text-muted-foreground">Idiomas: {p.idiomas.join(", ")}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Valores e horários disponíveis aparecem após o cadastro na plataforma.
            </p>
            <Link
              to="/profissionais/$slug"
              params={{ slug: p.slug }}
              className="btn-base btn-ghost mt-6 w-full"
            >
              Ver perfil
            </Link>
          </article>
        ))}
      </div>

      {resultados.length === 0 && (
        <div className="card-soft mt-5 p-8">
          <h2 className="text-xl">
            {profissionais.length === 0
              ? "Em breve, novos profissionais especializados em TOC estarão disponíveis na plataforma."
              : "Nenhum profissional corresponde a esses filtros no momento."}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {profissionais.length === 0
              ? "Cada perfil passa por verificação de registro e documentos antes de ser publicado. Assim que a análise for concluída, os profissionais aparecem aqui."
              : "Tente remover uma preferência para ampliar o resultado."}
          </p>
          {profissionais.length === 0 && (
            <Link to="/cadastro-profissional" className="btn-base btn-ghost mt-6">
              Sou profissional e quero fazer parte
            </Link>
          )}
        </div>
      )}

    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (
    <div>
      <label htmlFor={id} className="section-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-base mt-2"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
