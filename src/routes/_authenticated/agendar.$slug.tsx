import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  configuracoesPlataforma,
  criarAgendamento,
  listarHorariosLivres,
  obterProfissional,
} from "@/lib/plataforma.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/agendar/$slug")({
  head: () => ({
    meta: [
      { title: "Agendar consulta — TOC Brazil" },
      { name: "description", content: "Escolha o dia e o horário da sua consulta online." },
      { property: "og:title", content: "Agendar consulta — TOC Brazil" },
      { property: "og:description", content: "Escolha o dia e o horário da sua consulta online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Agendar;
});

const TZ = "America/Sao_Paulo";

function diaChave(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ });
}
function diaRotulo(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Agendar() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const buscarProfissional = useServerFn(obterProfissional);
  const buscarHorarios = useServerFn(listarHorariosLivres);
  const buscarConfig = useServerFn(configuracoesPlataforma);
  const agendar = useServerFn(criarAgendamento);

  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const prof = useQuery({
    queryKey: ["profissional", slug],
    queryFn: () => buscarProfissional({ data: { slug } }),
  });
  const horarios = useQuery({
    queryKey: ["horarios", slug],
    queryFn: () => buscarHorarios({ data: { slug, dias: 21 } }),
  });
  const config = useQuery({ queryKey: ["config"], queryFn: () => buscarConfig() });

  const porDia = useMemo(() => {
    const mapa = new Map<string, { rotulo: string; slots: { inicio: string; fim: string }[] }>();
    for (const s of horarios.data?.horarios ?? []) {
      const k = diaChave(s.inicio);
      if (!mapa.has(k)) mapa.set(k, { rotulo: diaRotulo(s.inicio), slots: [] });
      mapa.get(k)!.slots.push(s);
    }
    return [...mapa.values()];
  }, [horarios.data]);

  const p = prof.data?.profissional;
  const valor = config.data?.taxaCentavos ?? 5000;

  if (prof.isLoading) {
    return <div className="container-page py-20 text-muted-foreground">Carregando agenda…</div>;
  }
  if (!p) {
    return (
      <div className="container-page py-20">
        <h1 className="text-3xl">Profissional indisponível</h1>
        <Link to="/profissionais" className="btn-base btn-primary mt-8">
          Ver profissionais
        </Link>
      </div>
    );
  }

  async function confirmar() {
    if (!selecionado) return;
    setErro(null);
    setEnviando(true);
    try {
      track("checkout_started", { slug, inicio: selecionado });
      const r = await agendar({ data: { slug, inicio: selecionado } });
      if (!r.ok) {
        setErro(r.erro);
        await queryClient.invalidateQueries({ queryKey: ["horarios", slug] });
        return;
      }
      navigate({ to: "/painel" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <Link
        to="/profissionais/$slug"
        params={{ slug }}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Voltar ao perfil
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <span className="section-label">Agendamento</span>
          <h1 className="mt-3 text-3xl sm:text-4xl">
            Escolha um horário com {p.nome.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {p.nome} · {p.registro} · {p.uf} · sessão de {p.slot_minutos} minutos, online
          </p>

          {horarios.isLoading && (
            <p className="mt-8 text-sm text-muted-foreground">Carregando horários livres…</p>
          )}
          {!horarios.isLoading && porDia.length === 0 && (
            <p className="card-soft mt-8 p-6 text-sm text-muted-foreground">
              Não há horários livres nos próximos dias. Você pode escolher outro profissional ou
              tentar novamente mais tarde.
            </p>
          )}

          <div className="mt-8 space-y-6">
            {porDia.map((dia) => (
              <section key={dia.rotulo} className="card-soft p-6">
                <h2 className="text-base capitalize">{dia.rotulo}</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {dia.slots.map((s) => (
                    <li key={s.inicio}>
                      <button
                        type="button"
                        aria-pressed={selecionado === s.inicio}
                        onClick={() => {
                          setSelecionado(s.inicio);
                          track("schedule_started", { slug, inicio: s.inicio });
                        }}
                        className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                          selecionado === s.inicio
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        {hora(s.inicio)}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft p-6">
            <h2 className="text-lg">Resumo</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Profissional</dt>
                <dd>{p.nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duração</dt>
                <dd>{p.slot_minutos} minutos</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Horário</dt>
                <dd>{selecionado ? `${diaRotulo(selecionado)}, ${hora(selecionado)}` : "—"}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt>Valor</dt>
                <dd className="font-semibold">
                  R$ {(valor / 100).toFixed(2).replace(".", ",")}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={!selecionado || enviando}
              onClick={confirmar}
              className="btn-base btn-primary mt-6 w-full disabled:opacity-50"
            >
              {enviando ? "Reservando…" : selecionado ? "Reservar este horário" : "Escolha um horário"}
            </button>
            {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              O horário fica reservado no seu nome e a consulta é confirmada após a aprovação do
              pagamento. O meio de pagamento com cartão ainda está sendo conectado à plataforma.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Cancelamento sem custo até 24 horas antes do horário marcado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
