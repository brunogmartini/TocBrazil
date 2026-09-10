import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { financeiroProfissional, type LancamentoFinanceiro } from "@/lib/profissional.functions";
import { ProfessionalNav } from "@/components/professional-nav";
import { dataBR, horaBR, moeda } from "@/lib/video-sala";

export const Route = createFileRoute("/_authenticated/profissional/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — TOC Brazil" },
      { name: "description", content: "Valores futuros, a receber e extrato detalhado das suas consultas." },
      { property: "og:title", content: "Financeiro do profissional — TOC Brazil" },
      { property: "og:description", content: "Extrato com valor bruto, taxa da plataforma e líquido por consulta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Financeiro,
});

const rotuloSituacao: Record<LancamentoFinanceiro["situacao"], string> = {
  agendada: "Agendada",
  a_receber: "A receber",
  pago: "Pago",
  cancelada: "Cancelada",
  nao_compareceu: "Não compareceu",
  aguardando_pagamento: "Aguardando taxa",
};

type Filtro = "todos" | "agendada" | "a_receber" | "pago";

function Financeiro() {
  const carregar = useServerFn(financeiroProfissional);
  const dados = useQuery({ queryKey: ["financeiro-profissional"], queryFn: () => carregar() });
  const [filtro, setFiltro] = useState<Filtro>("todos");

  if (dados.isLoading) {
    return <div className="professional-workspace container-page py-16 text-muted-foreground">Carregando…</div>;
  }
  if (!dados.data?.profissional) {
    return (
      <div className="professional-workspace container-page py-16">
        <h1 className="text-3xl">Complete seu cadastro primeiro</h1>
        <Link to="/profissional/cadastro" className="btn-base btn-primary mt-8">
          Ir para o meu cadastro
        </Link>
      </div>
    );
  }

  const { lancamentos, resumo } = dados.data;
  const visiveis = lancamentos.filter((l) => filtro === "todos" || l.situacao === filtro);
  const comissao = resumo?.comissaoPercent ?? 25;

  return (
    <div className="professional-workspace py-12 lg:py-16">
      <div className="container-page">
        <div className="professional-heading p-6 sm:p-8">
          <span className="professional-label">Consultório digital</span>
          <h1 className="mt-3 text-3xl sm:text-4xl">Financeiro</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            O valor da consulta só passa a ser devido a você depois que o atendimento é realizado. A
            plataforma retém {comissao}% e você recebe {100 - comissao}%. A taxa de agendamento de{" "}
            {moeda(lancamentos[0]?.taxaAgendamento ?? 5000)} paga pelo paciente é receita de intermediação
            da plataforma e aparece separadamente.
          </p>
        </div>

        <ProfessionalNav ativo="/profissional/financeiro" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="professional-metric p-6">
            <p className="professional-label">Valores futuros</p>
            <p className="mt-2 font-display text-2xl">{moeda(resumo?.futurosLiquido ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {resumo?.consultasAgendadas ?? 0} agendada(s) · bruto {moeda(resumo?.futurosBruto ?? 0)} · ainda não devido
            </p>
          </div>
          <div className="professional-metric p-6">
            <p className="professional-label">A receber</p>
            <p className="mt-2 font-display text-2xl">{moeda(resumo?.aReceber ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">consultas realizadas aguardando repasse</p>
          </div>
          <div className="professional-metric p-6">
            <p className="professional-label">Recebido</p>
            <p className="mt-2 font-display text-2xl">{moeda(resumo?.recebido ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">repasses já pagos pela plataforma</p>
          </div>
          <div className="professional-metric p-6">
            <p className="professional-label">Taxas de agendamento</p>
            <p className="mt-2 font-display text-2xl">{moeda(resumo?.taxasAgendamento ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">pagas pelos pacientes à plataforma</p>
          </div>
        </div>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">Extrato</h2>
            <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
              {(
                [
                  ["todos", "Todos"],
                  ["agendada", "Agendadas"],
                  ["a_receber", "A receber"],
                  ["pago", "Pagas"],
                ] as const
              ).map(([id, rotulo]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltro(id)}
                  className={`rounded-full px-3 py-1.5 ${filtro === id ? "bg-background font-semibold" : "text-muted-foreground"}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          {visiveis.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum lançamento neste filtro.</p>
          ) : (
            <div className="card-soft mt-5 overflow-x-auto p-0">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="px-5 py-3">Consulta</th>
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-5 py-3 text-right">Bruto</th>
                    <th className="px-5 py-3 text-right">Plataforma ({comissao}%)</th>
                    <th className="px-5 py-3 text-right">Líquido</th>
                    <th className="px-5 py-3 text-right">Taxa agend.</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((l) => {
                    const naoConta = l.situacao === "cancelada" || l.situacao === "nao_compareceu" || l.situacao === "aguardando_pagamento";
                    return (
                      <tr key={l.id} className={`border-b border-border/40 last:border-0 ${naoConta ? "opacity-60" : ""}`}>
                        <td className="px-5 py-3">
                          <p className="font-semibold">{dataBR(l.inicio)}</p>
                          <p className="text-xs text-muted-foreground">{horaBR(l.inicio)}</p>
                        </td>
                        <td className="px-5 py-3">
                          {l.paciente}
                          {l.codigo && <span className="ml-1 text-xs text-muted-foreground">{l.codigo}</span>}
                        </td>
                        <td className="px-5 py-3 text-right">{moeda(l.bruto)}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">− {moeda(l.plataforma)}</td>
                        <td className="px-5 py-3 text-right font-semibold">{naoConta ? "—" : moeda(l.liquido)}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{moeda(l.taxaAgendamento)}</td>
                        <td className="px-5 py-3">
                          <span className="pill">{rotuloSituacao[l.situacao]}</span>
                          {l.situacao === "pago" && l.pagoEm && (
                            <p className="mt-1 text-[11px] text-muted-foreground">pago em {dataBR(l.pagoEm)}</p>
                          )}
                          {l.situacao === "a_receber" && l.previstoPara && (
                            <p className="mt-1 text-[11px] text-muted-foreground">previsto {dataBR(l.previstoPara)}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
