import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { financeiroProfissional, minhaAgendaProfissional, type ConsultaAgenda } from "@/lib/profissional.functions";
import { ConsultaDetalhe } from "@/components/consulta-detalhe";
import { EtapasCadastro, ProfessionalNav } from "@/components/professional-nav";
import { chaveDia, hoje, horaDe, rotuloDiaLongo } from "@/lib/agenda-tempo";
import { moeda, rotuloStatusConsulta } from "@/lib/video-sala";
import { exigirAreaProfissional } from "@/lib/role-access";
import { TAXA_FIXA_CENTAVOS } from "@/lib/precos";
import { missingRoomAlert } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/profissional/")({
  beforeLoad: () => exigirAreaProfissional(),
  head: () => ({
    meta: [
      { title: "Consultório digital — TOC Brazil" },
      { name: "description", content: "Suas consultas de hoje, próximas sessões e resumo financeiro." },
      { property: "og:title", content: "Consultório digital — TOC Brazil" },
      { property: "og:description", content: "Consultas, agenda e financeiro em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelProfissional,
});

function PainelProfissional() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(minhaAgendaProfissional);
  const carregarFinanceiro = useServerFn(financeiroProfissional);
  const dados = useQuery({
    queryKey: ["agenda-profissional", "visao-geral"],
    queryFn: () => carregar(),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const financeiro = useQuery({
    queryKey: ["financeiro-profissional"],
    queryFn: () => carregarFinanceiro(),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const [selecionada, setSelecionada] = useState<ConsultaAgenda | null>(null);

  const prof = dados.data?.profissional ?? null;
  const consultas = dados.data?.consultas ?? [];
  const diaHoje = hoje();
  const agora = Date.now();
  const deHoje = consultas.filter((c) => chaveDia(c.inicio) === diaHoje && c.status !== "cancelada");
  const proximas = consultas
    .filter((c) => new Date(c.inicio).getTime() > agora && c.status !== "cancelada" && chaveDia(c.inicio) !== diaHoje)
    .slice(0, 6);
  const pendentesDeConclusao = consultas.filter(
    (c) => c.status === "confirmada" && new Date(c.fim).getTime() <= agora,
  );

  async function recarregar() {
    await queryClient.invalidateQueries({ queryKey: ["agenda-profissional"] });
    await queryClient.invalidateQueries({ queryKey: ["financeiro-profissional"] });
    setSelecionada(null);
  }

  if (dados.isLoading) {
    return <div className="professional-workspace container-page py-16 text-muted-foreground">Carregando…</div>;
  }

  if (!prof) {
    return (
      <div className="professional-workspace container-page py-16">
        <span className="professional-label">Área do profissional</span>
        <h1 className="mt-3 text-3xl sm:text-4xl">Vamos começar seu cadastro</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Preencha seus dados profissionais e envie os documentos para verificação. Depois disso você
          define sua agenda e seu perfil fica disponível para agendamentos.
        </p>
        <Link to="/profissional/cadastro" className="btn-base btn-primary mt-8">
          Preencher meu cadastro
        </Link>
      </div>
    );
  }

  const etapa = dados.data!.etapa;
  const resumo = financeiro.data?.resumo;

  return (
    <div className="professional-workspace py-12 lg:py-16">
      <div className="container-page">
        <div className="professional-heading flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div>
            <span className="professional-label">Consultório digital</span>
            <h1 className="mt-3 text-3xl sm:text-4xl">{prof.nome}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className={etapa.chave === "publicado" || etapa.chave === "aprovado" ? "badge-aprovado" : "pill"}>
                {etapa.titulo}
              </span>
              <span>
                consultas de {prof.slot_minutos} min · {moeda(Math.max((prof.valor_centavos ?? 0) - TAXA_FIXA_CENTAVOS, 0))} líquidos por consulta
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {etapa.chave === "publicado" ? <Link to="/profissional/agenda" className="btn-base btn-primary">Abrir agenda</Link> : <Link to="/profissional/cadastro" className="btn-base btn-primary">Continuar credenciamento</Link>}
            <Link to="/profissional/financeiro" className="btn-base btn-ghost">
              Financeiro
            </Link>
          </div>
        </div>

        <ProfessionalNav ativo="/profissional" />

        {etapa.chave !== "publicado" && (
          <div className="card-soft mt-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{etapa.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{etapa.descricao}</p>
                {prof.observacao_admin && (etapa.chave === "correcao" || etapa.chave === "rejeitado") && (
                  <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
                    <span className="font-semibold">Observação da análise:</span> {prof.observacao_admin}
                  </p>
                )}
              </div>
              <Link
                 to="/profissional/cadastro"
                className="btn-base btn-ghost"
              >
                 {etapa.chave === "aprovado" ? "Ler contrato" : "Ver cadastro"}
              </Link>
            </div>
            <div className="mt-5">
              <EtapasCadastro etapaAtual={etapa} />
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="professional-metric p-6">
            <p className="professional-label">Hoje</p>
            <p className="mt-2 font-display text-2xl">{deHoje.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">consulta{deHoje.length === 1 ? "" : "s"} no dia</p>
          </div>
          <div className="professional-metric p-6">
            <p className="professional-label">Agendadas</p>
            <p className="mt-2 font-display text-2xl">{resumo?.consultasAgendadas ?? 0}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {moeda(resumo?.futurosLiquido ?? 0)} previstos após realizadas
            </p>
          </div>
          <div className="professional-metric p-6">
            <p className="professional-label">A receber</p>
            <p className="mt-2 font-display text-2xl">{moeda(resumo?.aReceber ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">consultas realizadas aguardando confirmação financeira</p>
          </div>
          <div className="professional-metric p-6">
            <p className="professional-label">Já recebido</p>
            <p className="mt-2 font-display text-2xl">{moeda(resumo?.recebido ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
               valor recebido após a dedução da taxa fixa da plataforma
            </p>
          </div>
        </div>

        {consultas.some((c) => c.status === "confirmada" && missingRoomAlert(c.inicio, !!c.meeting_url_updated_at)) && <div role="alert" className="card-soft mt-8 border-primary/40 p-5 text-sm"><p className="font-semibold">Informe o link das consultas que começam em menos de 24 horas.</p><div className="mt-3 flex flex-wrap gap-2">{consultas.filter((c) => c.status === "confirmada" && missingRoomAlert(c.inicio, !!c.meeting_url_updated_at)).map((c) => <button key={c.id} type="button" className="pill" onClick={() => setSelecionada(c)}>{horaDe(c.inicio)} · Informar link</button>)}</div></div>}

        {pendentesDeConclusao.length > 0 && (
          <div className="card-soft mt-8 border-primary/40 p-5 text-sm">
            <p className="font-semibold">
              {pendentesDeConclusao.length} consulta{pendentesDeConclusao.length > 1 ? "s" : ""} com horário encerrado
            </p>
            <p className="mt-1 text-muted-foreground">
              Registre sua confirmação de presença; isso não executa repasses nem altera seu extrato.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendentesDeConclusao.map((c) => (
                <button key={c.id} type="button" className="pill hover:bg-accent" onClick={() => setSelecionada(c)}>
                  {rotuloDiaLongo(chaveDia(c.inicio))} · {horaDe(c.inicio)} · {c.paciente}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-2xl">Hoje</h2>
            {deHoje.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nenhuma consulta hoje.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {deHoje.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionada(c)}
                      className="card-soft flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left hover:border-primary/60"
                    >
                      <span>
                        <span className="font-display text-lg">{horaDe(c.inicio)}</span>{" "}
                        <span className="text-sm">— {c.paciente}</span>
                      </span>
                      <span className="pill">{rotuloStatusConsulta[c.status] ?? c.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-2xl">Próximas</h2>
            {proximas.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nenhuma consulta agendada nos próximos dias.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {proximas.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionada(c)}
                      className="card-soft flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left hover:border-primary/60"
                    >
                      <span className="text-sm">
                        <span className="font-semibold">{rotuloDiaLongo(chaveDia(c.inicio))}</span> · {horaDe(c.inicio)} — {c.paciente}
                      </span>
                      <span className="pill">{rotuloStatusConsulta[c.status] ?? c.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/profissional/agenda" className="mt-4 inline-block text-sm underline underline-offset-4">
              Ver agenda completa
            </Link>
          </section>
        </div>
      </div>

      <ConsultaDetalhe consulta={selecionada} onFechar={() => setSelecionada(null)} onAtualizado={recarregar} />
    </div>
  );
}
