import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  criarBloqueio,
  minhaAgendaProfissional,
  removerBloqueio,
  salvarDisponibilidade,
  type ConsultaAgenda,
} from "@/lib/profissional.functions";
import { AgendaProfissional as AgendaVisual, type Bloqueio, type Visao } from "@/components/agenda-profissional";
import { ConsultaDetalhe } from "@/components/consulta-detalhe";
import { ProfessionalNav } from "@/components/professional-nav";
import { Modal } from "@/components/modal";
import {
  DIAS_SEMANA,
  dataLocal,
  deInputLocal,
  hoje,
  paraInputLocal,
  primeiroDiaDoMes,
  somarMeses,
} from "@/lib/agenda-tempo";
import { dataHoraBR } from "@/lib/video-sala";
import { exigirAreaProfissional } from "@/lib/role-access";

export const Route = createFileRoute("/_authenticated/profissional/agenda")({
  beforeLoad: async ({ context }) => exigirAreaProfissional(context.user.id),
  head: () => ({
    meta: [
      { title: "Minha agenda — TOC Brazil" },
      { name: "description", content: "Agenda visual com consultas, disponibilidade e bloqueios." },
      { property: "og:title", content: "Minha agenda — TOC Brazil" },
      { property: "og:description", content: "Consultas, horários livres e bloqueios em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaAgenda,
});

type Faixa = { ativo: boolean; inicio: string; fim: string };
const MOTIVOS = ["Médico", "Férias", "Compromisso pessoal", "Congresso", "Ausência", "Indisponível"];

function PaginaAgenda() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(minhaAgendaProfissional);
  const salvar = useServerFn(salvarDisponibilidade);
  const bloquear = useServerFn(criarBloqueio);
  const desbloquear = useServerFn(removerBloqueio);

  const [visao, setVisao] = useState<Visao>("semana");
  const [dia, setDia] = useState(hoje());
  const mesBase = primeiroDiaDoMes(dia);
  const de = dataLocal(somarMeses(mesBase, -1)).toISOString();
  const ate = dataLocal(somarMeses(mesBase, 2)).toISOString();

  const dados = useQuery({
    queryKey: ["agenda-profissional", de, ate],
    queryFn: () => carregar({ data: { de, ate } }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const [consulta, setConsulta] = useState<ConsultaAgenda | null>(null);
  const [bloqueioSel, setBloqueioSel] = useState<Bloqueio | null>(null);
  const [novoBloqueio, setNovoBloqueio] = useState<{ inicio: string; fim: string; motivo: string } | null>(null);
  const [editandoDisponibilidade, setEditandoDisponibilidade] = useState(false);
  const [faixas, setFaixas] = useState<Faixa[]>(
    DIAS_SEMANA.map((_, i) => ({ ativo: i >= 1 && i <= 5, inicio: "09:00", fim: "17:00" })),
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const regras = dados.data?.regras;
    if (regras && regras.length) {
      setFaixas(
        DIAS_SEMANA.map((_, i) => {
          const r = regras.find((x) => x.weekday === i);
          return r
            ? { ativo: true, inicio: r.hora_inicio.slice(0, 5), fim: r.hora_fim.slice(0, 5) }
            : { ativo: false, inicio: "09:00", fim: "17:00" };
        }),
      );
    }
  }, [dados.data]);

  async function recarregar() {
    await queryClient.invalidateQueries({ queryKey: ["agenda-profissional"] });
    setConsulta(null);
  }

  const prof = dados.data?.profissional;
  if (!dados.isLoading && !prof) {
    return (
      <div className="professional-workspace container-page py-16">
        <h1 className="text-3xl">Complete seu cadastro primeiro</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Assim que seus dados profissionais estiverem salvos, você poderá definir sua agenda.
        </p>
        <Link to="/profissional/cadastro" className="btn-base btn-primary mt-8">
          Ir para o meu cadastro
        </Link>
      </div>
    );
  }

  const regras = dados.data?.regras ?? [];

  return (
    <div className="professional-workspace py-12 lg:py-16">
      <div className="container-page">
        <div className="professional-heading flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div>
            <span className="professional-label">Consultório digital</span>
            <h1 className="mt-3 text-3xl sm:text-4xl">Minha agenda</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {regras.length === 0
                ? "Defina sua disponibilidade recorrente para começar a receber agendamentos."
                : "Clique em um horário para bloquear, ou em uma consulta para ver os detalhes."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-base btn-primary" onClick={() => setEditandoDisponibilidade(true)}>
              Disponibilidade recorrente
            </button>
            <button
              type="button"
              className="btn-base btn-ghost"
              onClick={() => {
                const inicio = dataLocal(dia, 9);
                setNovoBloqueio({
                  inicio: paraInputLocal(inicio),
                  fim: paraInputLocal(new Date(inicio.getTime() + 3600_000)),
                  motivo: "",
                });
              }}
            >
              Bloquear período
            </button>
          </div>
        </div>

        <ProfessionalNav ativo="/profissional/agenda" />

        {aviso && <p className="card-soft mt-6 border-primary/40 p-4 text-sm" role="status">{aviso}</p>}
        {erro && <p className="mt-6 text-sm text-destructive" role="alert">{erro}</p>}

        <div className="mt-6">
          {dados.isLoading ? (
            <div className="card-soft p-8 text-sm text-muted-foreground">Carregando agenda…</div>
          ) : (
            <AgendaVisual
              consultas={dados.data?.consultas ?? []}
              regras={regras}
              bloqueios={dados.data?.bloqueios ?? []}
              slotMinutos={prof?.slot_minutos ?? 50}
              visao={visao}
              dia={dia}
              onMudarVisao={setVisao}
              onMudarDia={setDia}
              onSelecionarConsulta={setConsulta}
              onSelecionarBloqueio={setBloqueioSel}
              onNovoBloqueio={(inicio, fim) =>
                setNovoBloqueio({ inicio: paraInputLocal(inicio), fim: paraInputLocal(fim), motivo: "" })
              }
            />
          )}
        </div>
      </div>

      <ConsultaDetalhe consulta={consulta} onFechar={() => setConsulta(null)} onAtualizado={recarregar} />

      <Modal
        aberto={editandoDisponibilidade}
        titulo="Disponibilidade recorrente"
        onFechar={() => setEditandoDisponibilidade(false)}
      >
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErro(null);
            const r = await salvar({
              data: {
                regras: faixas
                  .map((f, i) => ({ weekday: i, hora_inicio: f.inicio, hora_fim: f.fim, ativo: f.ativo }))
                  .filter((f) => f.ativo)
                  .map(({ weekday, hora_inicio, hora_fim }) => ({ weekday, hora_inicio, hora_fim })),
              },
            });
            if (!r.ok) setErro(r.erro);
            else {
              setAviso("Disponibilidade atualizada. Os horários livres já aparecem para os pacientes.");
              setEditandoDisponibilidade(false);
              await recarregar();
            }
          }}
        >
          <p className="text-sm text-muted-foreground">
            Esses horários se repetem toda semana. Depois, bloqueie exceções diretamente no calendário.
          </p>
          {DIAS_SEMANA.map((nome, i) => {
            const f = faixas[i]!;
            return (
              <div key={nome} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3">
                <label className="flex w-40 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={f.ativo}
                    onChange={(e) => setFaixas(faixas.map((x, j) => (j === i ? { ...x, ativo: e.target.checked } : x)))}
                  />
                  {nome}
                </label>
                <input
                  type="time"
                  className="field-base w-32"
                  value={f.inicio}
                  disabled={!f.ativo}
                  onChange={(e) => setFaixas(faixas.map((x, j) => (j === i ? { ...x, inicio: e.target.value } : x)))}
                />
                <span className="text-xs text-muted-foreground">às</span>
                <input
                  type="time"
                  className="field-base w-32"
                  value={f.fim}
                  disabled={!f.ativo}
                  onChange={(e) => setFaixas(faixas.map((x, j) => (j === i ? { ...x, fim: e.target.value } : x)))}
                />
              </div>
            );
          })}
          <button type="submit" className="btn-base btn-primary w-full">
            Salvar disponibilidade
          </button>
        </form>
      </Modal>

      <Modal aberto={Boolean(novoBloqueio)} titulo="Bloquear período" onFechar={() => setNovoBloqueio(null)} largura="max-w-md">
        {novoBloqueio && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setErro(null);
              const r = await bloquear({
                data: {
                  inicio: deInputLocal(novoBloqueio.inicio).toISOString(),
                  fim: deInputLocal(novoBloqueio.fim).toISOString(),
                  motivo: novoBloqueio.motivo,
                },
              });
              if (!r.ok) setErro(r.erro);
              else {
                setNovoBloqueio(null);
                setAviso("Período bloqueado.");
                await recarregar();
              }
            }}
          >
            <label className="block text-sm">
              Início
              <input
                type="datetime-local"
                className="field-base mt-1"
                value={novoBloqueio.inicio}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, inicio: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm">
              Fim
              <input
                type="datetime-local"
                className="field-base mt-1"
                value={novoBloqueio.fim}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, fim: e.target.value })}
                required
              />
            </label>
            <div>
              <p className="text-sm">Motivo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MOTIVOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNovoBloqueio({ ...novoBloqueio, motivo: m })}
                    className={`pill ${novoBloqueio.motivo === m ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                className="field-base mt-3"
                placeholder="Ou descreva (opcional)"
                maxLength={120}
                value={novoBloqueio.motivo}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-base btn-primary w-full">
              Bloquear
            </button>
          </form>
        )}
      </Modal>

      <Modal aberto={Boolean(bloqueioSel)} titulo="Período bloqueado" onFechar={() => setBloqueioSel(null)} largura="max-w-md">
        {bloqueioSel && (
          <div className="space-y-4 text-sm">
            <p className="text-lg">{bloqueioSel.motivo ?? "Bloqueado"}</p>
            <p className="text-muted-foreground">
              {dataHoraBR(bloqueioSel.inicio)} até {dataHoraBR(bloqueioSel.fim)}
            </p>
            <button
              type="button"
              className="btn-base btn-ghost"
              onClick={async () => {
                const r = await desbloquear({ data: { id: bloqueioSel.id } });
                if (!r.ok) setErro(r.erro);
                else {
                  setBloqueioSel(null);
                  await recarregar();
                }
              }}
            >
              Remover bloqueio
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
