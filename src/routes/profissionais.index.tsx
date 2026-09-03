import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PROFISSIONAIS_DEMO, formatarPreco } from "@/lib/profissionais-mock";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/profissionais/")({
  head: () => ({
    meta: [
      { title: "Encontrar psicólogo ou psiquiatra online — TOC Brazil" },
      {
        name: "description",
        content:
          "Compare perfis de psicólogos e psiquiatras por profissão, abordagem, área de atuação, idioma, valor e disponibilidade para atendimento online relacionado ao TOC.",
      },
      { property: "og:title", content: "Encontre um profissional para acompanhamento em TOC" },
      {
        property: "og:description",
        content:
          "Filtros por preferências, informações declaradas e verificadas, sem ranking de popularidade.",
      },
      { property: "og:url", content: "/profissionais" },
    ],
    links: [{ rel: "canonical", href: "/profissionais" }],
  }),
  component: Busca,
});

const TODOS = "Todos";

function Busca() {
  const [profissao, setProfissao] = useState(TODOS);
  const [area, setArea] = useState(TODOS);
  const [abordagem, setAbordagem] = useState(TODOS);
  const [idioma, setIdioma] = useState(TODOS);
  const [genero, setGenero] = useState(TODOS);
  const [experienciaMin, setExperienciaMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(50000);
  const [ordem, setOrdem] = useState<"nome" | "preco" | "disponibilidade">("nome");

  const areas = useMemo(
    () => [TODOS, ...new Set(PROFISSIONAIS_DEMO.flatMap((p) => p.areas))],
    [],
  );
  const abordagens = useMemo(
    () => [
      TODOS,
      ...new Set(PROFISSIONAIS_DEMO.map((p) => p.abordagem).filter((a): a is string => !!a)),
    ],
    [],
  );
  const idiomas = useMemo(
    () => [TODOS, ...new Set(PROFISSIONAIS_DEMO.flatMap((p) => p.idiomas))],
    [],
  );

  const resultados = useMemo(() => {
    const list = PROFISSIONAIS_DEMO.filter(
      (p) =>
        (profissao === TODOS || p.profissao === profissao) &&
        (area === TODOS || p.areas.includes(area)) &&
        (abordagem === TODOS || p.abordagem === abordagem) &&
        (idioma === TODOS || p.idiomas.includes(idioma)) &&
        (genero === TODOS || p.genero === genero) &&
        p.experienciaAnos >= experienciaMin &&
        p.precoCentavos <= precoMax,
    );
    if (ordem === "preco") return [...list].sort((a, b) => a.precoCentavos - b.precoCentavos);
    if (ordem === "disponibilidade")
      return [...list].sort((a, b) => a.horarios[0]!.localeCompare(b.horarios[0]!));
    return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [profissao, area, abordagem, idioma, genero, experienciaMin, precoMax, ordem]);

  useEffect(() => {
    track("professional_search", {
      profissao,
      area,
      abordagem,
      idioma,
      genero,
      experienciaMin,
      precoMax,
      resultados: resultados.length,
    });
  }, [profissao, area, abordagem, idioma, genero, experienciaMin, precoMax, resultados.length]);

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Profissionais</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Encontre um profissional</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        As informações são declaradas pelos profissionais e a documentação é verificada pela
        plataforma. A ordenação é neutra: não indicamos que um profissional é melhor do que
        outro.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Prefere ajuda para escolher?{" "}
        <Link to="/matching" className="font-semibold underline-offset-4 hover:underline">
          Responda algumas perguntas de preferência
        </Link>
        .
      </p>

      <form
        className="card-soft mt-8 grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Profissão"
          value={profissao}
          onChange={setProfissao}
          options={[TODOS, "Psicólogo(a)", "Psiquiatra"]}
        />
        <Select label="Área de atuação" value={area} onChange={setArea} options={areas} />
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
        <div>
          <label htmlFor="experiencia" className="section-label">
            Experiência declarada: {experienciaMin}+ anos
          </label>
          <input
            id="experiencia"
            type="range"
            min={0}
            max={15}
            step={1}
            value={experienciaMin}
            onChange={(e) => setExperienciaMin(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-primary)]"
          />
        </div>
        <div>
          <label htmlFor="preco" className="section-label">
            Até {formatarPreco(precoMax)}
          </label>
          <input
            id="preco"
            type="range"
            min={10000}
            max={50000}
            step={1000}
            value={precoMax}
            onChange={(e) => setPrecoMax(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-primary)]"
          />
        </div>
        <div>
          <label htmlFor="ordem" className="section-label">
            Ordenar por
          </label>
          <select
            id="ordem"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as typeof ordem)}
            className="field-base mt-2"
          >
            <option value="nome">Nome (A–Z)</option>
            <option value="preco">Valor da sessão</option>
            <option value="disponibilidade">Próxima disponibilidade</option>
          </select>
        </div>
      </form>

      <p className="mt-8 text-sm text-muted-foreground" role="status">
        {resultados.length} profissional(is) — todos com atendimento online
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {resultados.map((p) => (
          <article key={p.slug} className="card-soft card-soft-hover flex flex-col p-6">
            <span className="pill self-start">{p.profissao}</span>
            <h2 className="mt-4 text-lg">{p.nome}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.registro} · {p.uf} · {p.experienciaAnos} anos declarados
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
            <p className="mt-4 text-sm font-semibold">
              {formatarPreco(p.precoCentavos)}{" "}
              <span className="font-normal text-muted-foreground">por sessão</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Próximos horários: {p.horarios.join(" · ")}
            </p>
            <Link
              to="/profissionais/$slug"
              params={{ slug: p.slug }}
              className="btn-base btn-ghost mt-auto w-full"
              style={{ marginTop: "1.5rem" }}
            >
              Ver perfil
            </Link>
          </article>
        ))}
      </div>

      {resultados.length === 0 && (
        <p className="card-soft mt-5 p-6 text-sm text-muted-foreground">
          Nenhum profissional corresponde a esses filtros no momento. Tente ampliar a faixa de
          valor ou remover uma preferência.
        </p>
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
