import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PSICOLOGOS_DEMO, formatarPreco } from "@/lib/psicologos-mock";

export const Route = createFileRoute("/psicologos/")({
  head: () => ({
    meta: [
      { title: "Psicólogos para atendimento online — Acolher" },
      {
        name: "description",
        content:
          "Compare perfis de psicólogos habilitados por abordagem, área de atuação, idioma, valor e disponibilidade para atendimento online.",
      },
      { property: "og:title", content: "Psicólogos para atendimento online" },
      {
        property: "og:description",
        content:
          "Filtre por abordagem, área de atuação, idioma e valor da sessão e agende seu horário.",
      },
    ],
  }),
  component: Busca,
});

const TODAS = "Todas";

function Busca() {
  const [area, setArea] = useState(TODAS);
  const [abordagem, setAbordagem] = useState(TODAS);
  const [idioma, setIdioma] = useState(TODAS);
  const [precoMax, setPrecoMax] = useState(30000);
  const [ordem, setOrdem] = useState<"nome" | "preco" | "disponibilidade">("nome");

  const areas = useMemo(
    () => [TODAS, ...new Set(PSICOLOGOS_DEMO.flatMap((p) => p.areas))],
    [],
  );
  const abordagens = useMemo(
    () => [TODAS, ...new Set(PSICOLOGOS_DEMO.map((p) => p.abordagem))],
    [],
  );
  const idiomas = useMemo(
    () => [TODAS, ...new Set(PSICOLOGOS_DEMO.flatMap((p) => p.idiomas))],
    [],
  );

  const resultados = useMemo(() => {
    const list = PSICOLOGOS_DEMO.filter(
      (p) =>
        (area === TODAS || p.areas.includes(area)) &&
        (abordagem === TODAS || p.abordagem === abordagem) &&
        (idioma === TODAS || p.idiomas.includes(idioma)) &&
        p.precoCentavos <= precoMax,
    );
    if (ordem === "preco") return [...list].sort((a, b) => a.precoCentavos - b.precoCentavos);
    if (ordem === "disponibilidade")
      return [...list].sort((a, b) => a.horarios[0]!.localeCompare(b.horarios[0]!));
    return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [area, abordagem, idioma, precoMax, ordem]);

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="eyebrow">Profissionais</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Encontre seu psicólogo</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        As informações são declaradas pelos profissionais e verificadas pela plataforma. A
        ordenação é neutra e não indica que um profissional é melhor que outro.
      </p>

      <form
        className="card-soft mt-8 grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select label="Área de atuação" value={area} onChange={setArea} options={areas} />
        <Select
          label="Abordagem"
          value={abordagem}
          onChange={setAbordagem}
          options={abordagens}
        />
        <Select label="Idioma" value={idioma} onChange={setIdioma} options={idiomas} />
        <div>
          <label htmlFor="preco" className="eyebrow">
            Até {formatarPreco(precoMax)}
          </label>
          <input
            id="preco"
            type="range"
            min={10000}
            max={30000}
            step={1000}
            value={precoMax}
            onChange={(e) => setPrecoMax(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-primary)]"
          />
        </div>
        <div>
          <label htmlFor="ordem" className="eyebrow">
            Ordenar por
          </label>
          <select
            id="ordem"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as typeof ordem)}
            className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
          >
            <option value="nome">Nome (A–Z)</option>
            <option value="preco">Valor da sessão</option>
            <option value="disponibilidade">Próxima disponibilidade</option>
          </select>
        </div>
      </form>

      <p className="mt-8 text-sm text-muted-foreground" role="status">
        {resultados.length} profissional(is) encontrado(s)
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {resultados.map((p) => (
          <article key={p.slug} className="card-soft card-soft-hover flex flex-col p-6">
            <h2 className="text-lg">{p.nome}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.crp} · {p.uf} · {p.experienciaAnos} anos de atuação
            </p>
            <p className="mt-4 text-sm">{p.abordagem}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.areas.map((a) => (
                <li key={a} className="pill">
                  {a}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {p.apresentacao}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Idiomas: {p.idiomas.join(", ")}
            </p>
            <p className="mt-4 text-sm font-semibold">
              {formatarPreco(p.precoCentavos)}{" "}
              <span className="font-normal text-muted-foreground">por sessão</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Próximos horários: {p.horarios.join(" · ")}
            </p>
            <Link
              to="/psicologos/$slug"
              params={{ slug: p.slug }}
              className="btn-base btn-ghost mt-6 w-full"
            >
              Ver perfil
            </Link>
          </article>
        ))}
      </div>
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
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
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
