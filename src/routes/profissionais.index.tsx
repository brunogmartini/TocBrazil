import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listarProfissionais } from "@/lib/plataforma.functions";
import { solicitarAvisoDisponibilidade } from "@/lib/avisos.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { moeda } from "@/lib/video-sala";

export const Route = createFileRoute("/profissionais/")({
  loader: () => listarProfissionais(),
  head: () => ({
    meta: [
      { title: "Encontrar psicólogo online — TOC Brazil" },
      {
        name: "description",
        content:
          "Compare perfis de psicólogos por abordagem, preço, idioma, dia, turno e experiência declarada em TOC para agendamento de consultas online.",
      },
      { property: "og:title", content: "Encontre psicólogo com experiência em TOC" },
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
const TZ = "America/Sao_Paulo";

const FAIXAS: { rotulo: string; min: number; max: number }[] = [
  { rotulo: "Até R$ 150", min: 0, max: 15000 },
  { rotulo: "R$ 150 a R$ 250", min: 15000, max: 25000 },
  { rotulo: "R$ 250 a R$ 400", min: 25000, max: 40000 },
  { rotulo: "Acima de R$ 400", min: 40000, max: Number.MAX_SAFE_INTEGER },
];

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const TURNOS: { rotulo: string; de: number; ate: number }[] = [
  { rotulo: "Manhã (até 12h)", de: 0, ate: 12 },
  { rotulo: "Tarde (12h às 18h)", de: 12, ate: 18 },
  { rotulo: "Noite (a partir de 18h)", de: 18, ate: 24 },
];

function horarioBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function partesSP(iso: string) {
  const d = new Date(iso);
  const dia = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "numeric" as never }).format(d),
  );
  const semana = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(d);
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", hour12: false }).format(d),
  );
  const indice = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(
    semana,
  );
  return { diaSemana: Number.isNaN(dia) ? indice : indice, hora };
}

/** Sorteio estável por sessão: mesma ordem enquanto a pessoa navega. */
function semente() {
  if (typeof window === "undefined") return 1;
  const existente = window.sessionStorage.getItem("busca-ordem");
  if (existente) return Number(existente);
  const nova = Math.floor(Math.random() * 100000) + 1;
  window.sessionStorage.setItem("busca-ordem", String(nova));
  return nova;
}

function pesoAleatorio(slug: string, seed: number) {
  let h = seed;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) % 1000003;
  return h;
}
export const ABORDAGEM_EPR = "Exposição e Prevenção de Resposta (EPR)";
export const LABEL_PROFISSAO: Record<string, string> = {
  psicologo: "Psicólogo(a)",
};

function Busca() {
  const { profissionais } = Route.useLoaderData();
  const [abordagem, setAbordagem] = useState(TODOS);
  const [idioma, setIdioma] = useState(TODOS);
  const [genero, setGenero] = useState(TODOS);
  const [faixa, setFaixa] = useState(TODOS);
  const [dia, setDia] = useState(TODOS);
  const [turno, setTurno] = useState(TODOS);
  const [maisFiltros, setMaisFiltros] = useState(false);
  const [emailAviso, setEmailAviso] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [estadoAviso, setEstadoAviso] = useState<string | null>(null);
  const solicitarAviso = useServerFn(solicitarAvisoDisponibilidade);
  const seed = useMemo(() => semente(), []);

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

  const listaFiltrada = useMemo(() => {
    const faixaEscolhida = FAIXAS.find((f) => f.rotulo === faixa);
    const turnoEscolhido = TURNOS.find((t) => t.rotulo === turno);
    const diaEscolhido = DIAS.indexOf(dia);

    const combinaDisponibilidade = (proximos: string[]) => {
      if (dia === TODOS && turno === TODOS) return true;
      return proximos.some((iso) => {
        const { diaSemana, hora } = partesSP(iso);
        const okDia = diaEscolhido < 0 || diaSemana === diaEscolhido;
        const okTurno = !turnoEscolhido || (hora >= turnoEscolhido.de && hora < turnoEscolhido.ate);
        return okDia && okTurno;
      });
    };

    return profissionais
      .filter(
        (p) =>
          (abordagem === TODOS || p.abordagem === abordagem) &&
          (idioma === TODOS || p.idiomas.includes(idioma)) &&
          (genero === TODOS || p.genero === genero.toLowerCase()) &&
          (!faixaEscolhida ||
            (p.valor_centavos >= faixaEscolhida.min && p.valor_centavos < faixaEscolhida.max)) &&
          combinaDisponibilidade(p.proximos),
      )
      .sort((a, b) => {
        const ha = a.proximos[0] ? new Date(a.proximos[0]).getTime() : Infinity;
        const hb = b.proximos[0] ? new Date(b.proximos[0]).getTime() : Infinity;
        if (ha !== hb) return ha - hb;
        return pesoAleatorio(a.slug, seed) - pesoAleatorio(b.slug, seed);
      });
  }, [profissionais, abordagem, idioma, genero, faixa, dia, turno, seed]);

  useEffect(() => {
    track("professional_search", {
      abordagem,
      idioma,
      genero,
      faixa,
      dia,
      turno,
      itens: listaFiltrada.length,
    });
  }, [abordagem, idioma, genero, faixa, dia, turno, listaFiltrada.length]);


  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Profissionais</span>
      <h1 className="heading-page mt-3">Encontre um psicólogo com experiência em TOC</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Profissionais cadastrados, com inscrição no CRP conferida e documentos de formação apresentados. A ordenação mostra primeiro quem tem o horário livre mais próximo, sem destaque pago e sem indicar que um profissional é melhor do que outro.
      </p>


      {profissionais.length > 0 && <form
        className="card-soft mt-8 grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Abordagem teórica"
          value={abordagem}
          onChange={setAbordagem}
          options={abordagens}
        />
        <Select
          label="Faixa de preço"
          value={faixa}
          onChange={setFaixa}
          options={[TODOS, ...FAIXAS.map((f) => f.rotulo)]}
        />
        <Disponibilidade value={`${dia}|${turno}`} onChange={(valor) => {
          const [novoDia, novoTurno] = valor.split("|");
          setDia(novoDia ?? TODOS);
          setTurno(novoTurno ?? TODOS);
        }} />
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={() => setMaisFiltros((valor) => !valor)} aria-expanded={maisFiltros}>
            Mais filtros
          </Button>
        </div>
        {maisFiltros && (
          <div className="grid gap-5 md:col-span-2 md:grid-cols-2 lg:col-span-4">
            <Select label="Idioma" value={idioma} onChange={setIdioma} options={idiomas} />
            <Select label="Gênero (quando informado)" value={genero} onChange={setGenero} options={[TODOS, "Feminino", "Masculino"]} />
          </div>
        )}
      </form>}

      <p className="mt-8 text-sm text-muted-foreground" role="status">
        {listaFiltrada.length === 0
          ? "Nenhum psicólogo encontrado"
          : listaFiltrada.length === 1
            ? "1 psicólogo encontrado"
            : `${listaFiltrada.length} psicólogos encontrados`}
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {listaFiltrada.map((p) => (
          <article key={p.slug} className="card-soft card-soft-hover flex h-full flex-col p-6">
            <span className="pill self-start">Psicólogo(a)</span>
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
            <p className="mt-4 text-sm font-semibold">
              {moeda(p.valor_centavos)}{" "}
              <span className="font-normal text-muted-foreground">
                · sessão de {p.slot_minutos} min
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {p.proximos[0]
                ? `Próximo horário: ${horarioBR(p.proximos[0])}`
                : "Sem horários livres nos próximos dias"}
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

      {listaFiltrada.length === 0 && (
        <div className="card-soft mt-5 p-8">
          <h2 className="text-xl">{profissionais.length === 0 ? "Ainda estamos credenciando psicólogos" : "Nenhum psicólogo com esses filtros"}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {profissionais.length === 0
              ? "O credenciamento está em andamento e verificamos a inscrição de cada profissional no Conselho Regional de Psicologia antes de publicar o perfil."
              : "Limpe os filtros para ver novamente todos os perfis disponíveis."}
          </p>
          {profissionais.length === 0 && (
            <div className="mt-6 max-w-xl">
              <form className="grid gap-3" onSubmit={async (e) => {
                e.preventDefault();
                setEstadoAviso(null);
                const resposta = await solicitarAviso({ data: { email: emailAviso, consentimento } });
                setEstadoAviso(resposta.ok ? "Pronto. Avisaremos quando houver psicólogos disponíveis." : resposta.erro);
              }}>
                <label htmlFor="email-aviso" className="text-sm font-semibold">Avise-me quando houver psicólogos disponíveis</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input id="email-aviso" type="email" required value={emailAviso} onChange={(e) => setEmailAviso(e.target.value)} className="field-base" placeholder="seu@email.com" />
                  <Button type="submit" disabled={!consentimento}>Quero ser avisado</Button>
                </div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} required className="mt-0.5" />
                  Autorizo o uso deste e-mail para receber este aviso, conforme a Política de Privacidade.
                </label>
                {estadoAviso && <p role="status" className="text-sm text-muted-foreground">{estadoAviso}</p>}
              </form>
              <Link to="/entenda-o-toc" className="btn-base btn-ghost mt-5">Ver conteúdo educativo</Link>
            </div>
          )}
          {profissionais.length > 0 && (
            <Button type="button" variant="outline" className="mt-5" onClick={() => {
              setAbordagem(TODOS); setFaixa(TODOS); setDia(TODOS); setTurno(TODOS); setIdioma(TODOS); setGenero(TODOS);
            }}>Limpar filtros</Button>
          )}
        </div>
      )}

    </div>
  );
}

function Disponibilidade({ value, onChange }: { value: string; onChange: (valor: string) => void }) {
  const options = [
    { valor: `${TODOS}|${TODOS}`, rotulo: TODOS },
    ...DIAS.flatMap((dia) => [
      { valor: `${dia}|${TODOS}`, rotulo: dia },
      ...TURNOS.map((turno) => ({ valor: `${dia}|${turno.rotulo}`, rotulo: `${dia} · ${turno.rotulo.split(" (")[0]}` })),
    ]),
  ];
  return (
    <div>
      <label htmlFor="disponibilidade" className="section-label">Disponibilidade</label>
      <select id="disponibilidade" value={value} onChange={(e) => onChange(e.target.value)} className="field-base mt-2">
        {options.map((option) => <option key={option.valor} value={option.valor}>{option.rotulo}</option>)}
      </select>
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
