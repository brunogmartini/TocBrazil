import { supabase } from "@/integrations/supabase/client";
import { redirect } from "@tanstack/react-router";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  definirStatusConsultaAdmin,
  definirStatusDocumento,
  definirStatusLivro,
  definirStatusPagamento,
  definirStatusProfissional,
  definirStatusRepasse,
  editarProfissionalAdmin,
  painelAdmin,
  salvarConfiguracoes,
  type ProfissionalAdmin,
} from "@/lib/admin.functions";
import type { ConfiguracoesPlataforma } from "@/lib/plataforma.functions";
import { EtapasCadastro } from "@/components/professional-nav";
import { dataBR, dataHoraBR, moeda, rotuloStatusConsulta } from "@/lib/video-sala";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { user } = context as { user: any };
    const { data } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!data) {
      throw redirect({ to: "/painel" });
    }
  },
  head: () => ({
    meta: [
      { title: "Painel do gestor — TOC Brazil" },
      {
        name: "description",
        content:
          "Visão geral da plataforma: pacientes, profissionais, consultas, receita, repasses, livro e configurações.",
      },
      { property: "og:title", content: "Painel do gestor — TOC Brazil" },
      { property: "og:description", content: "Gestão completa da TOC Brazil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const rotuloPagamento: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  estornado: "Estornado",
  cancelado: "Cancelado",
};

const rotuloStatusProf: Record<string, string> = {
  pendente: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  suspenso: "Suspenso",
};

const rotuloDoc: Record<string, string> = {
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const rotuloLivro: Record<string, string> = {
  nao_comprado: "Não comprado",
  pendente: "Pendente / não confirmada",
  confirmada: "Compra confirmada",
  cancelada: "Cancelada",
};

const rotuloRepasse: Record<string, string> = {
  pendente: "A pagar",
  processando: "Processando",
  pago: "Pago",
  falhou: "Falhou",
};

type Aba = "visao" | "pacientes" | "profissionais" | "consultas" | "financeiro" | "livro" | "configuracoes";
type FiltroProf = "todos" | "pendente" | "aprovado" | "rejeitado" | "suspenso";
type FiltroRepasse = "a_receber" | "historico" | "todos";

function Admin() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(painelAdmin);
  const mudarStatusProf = useServerFn(definirStatusProfissional);
  const mudarStatusDoc = useServerFn(definirStatusDocumento);
  const editarProf = useServerFn(editarProfissionalAdmin);
  const mudarPagamento = useServerFn(definirStatusPagamento);
  const mudarConsulta = useServerFn(definirStatusConsultaAdmin);
  const mudarRepasse = useServerFn(definirStatusRepasse);
  const mudarLivro = useServerFn(definirStatusLivro);
  const salvarCfg = useServerFn(salvarConfiguracoes);

  const [aba, setAba] = useState<Aba>("visao");
  const [busca, setBusca] = useState("");
  const [filtroProf, setFiltroProf] = useState<FiltroProf>("pendente");
  const [filtroRepasse, setFiltroRepasse] = useState<FiltroRepasse>("a_receber");
  const [aberto, setAberto] = useState<string | null>(null);
  const [observacao, setObservacao] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const painel = useQuery({
    queryKey: ["painel-admin"],
    queryFn: () => carregar(),
    refetchInterval: aba === "financeiro" ? 15_000 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const atualizar = () => queryClient.invalidateQueries({ queryKey: ["painel-admin"] });

  if (painel.isError) {
    return (
      <div className="container-page py-20">
        <h1 className="text-3xl">Acesso restrito</h1>
        <p className="mt-3 text-muted-foreground">Esta área é exclusiva da gestão da plataforma.</p>
        <Link to="/painel" className="btn-base btn-primary mt-6">
          Voltar para minha área
        </Link>
      </div>
    );
  }

  const dados = painel.data;
  const filtro = busca.trim().toLowerCase();
  const t = dados?.totais;

  const pacientes = (dados?.pacientes ?? []).filter(
    (u) =>
      !(u.papeis.includes("profissional") || u.papeis.includes("admin")) &&
      (!filtro || (u.nome ?? "").toLowerCase().includes(filtro) || (u.email ?? "").toLowerCase().includes(filtro)),
  );
  const consultas = (dados?.consultas ?? []).filter(
    (c) => !filtro || c.paciente.toLowerCase().includes(filtro) || c.profissional.toLowerCase().includes(filtro),
  );
  const profissionais = (dados?.profissionais ?? []).filter(
    (p) =>
      (!filtro || p.nome.toLowerCase().includes(filtro) || p.registro.toLowerCase().includes(filtro)) &&
      (filtroProf === "todos" || p.status === filtroProf),
  );
  const repasses = (dados?.repasses ?? []).filter((r) => !filtro || r.profissional.toLowerCase().includes(filtro));
  const repassesVisiveis = repasses.filter((r) => {
    if (filtroRepasse === "a_receber") return r.status === "pendente" || r.status === "processando" || r.status === "falhou";
    if (filtroRepasse === "historico") return r.status === "pago";
    return true;
  });

  async function aplicarStatus(
    p: ProfissionalAdmin,
    status: "pendente" | "aprovado" | "rejeitado" | "suspenso",
    requerCorrecao = false,
  ) {
    const r = await mudarStatusProf({
      data: { id: p.id, status, observacao: observacao[p.id] ?? p.observacao_admin ?? "", requerCorrecao },
    });
    setAviso(r.ok ? "Status atualizado." : r.erro);
    await atualizar();
  }

  const ABAS: [Aba, string][] = [
    ["visao", "Visão geral"],
    ["pacientes", "Pacientes"],
    ["profissionais", `Profissionais${t?.pendentes ? ` (${t.pendentes})` : ""}`],
    ["consultas", "Consultas"],
    ["financeiro", "Pagamentos aos profissionais"],
    ["livro", "Livro"],
    ["configuracoes", "Configurações"],
  ];

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Gestão</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Painel do gestor</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Visão geral da plataforma, análise dos cadastros profissionais, pacientes, consultas, receita e
        repasses. Dados clínicos dos pacientes não são acessíveis pela gestão.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1 text-sm">
          {ABAS.map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAba(id)}
              className={`rounded-full px-4 py-2 ${aba === id ? "bg-background font-semibold" : "text-muted-foreground"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {aba !== "visao" && aba !== "configuracoes" && (
          <input
            className="field-base max-w-xs"
            placeholder="Buscar por nome, e-mail ou registro"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar"
          />
        )}
      </div>

      {aviso && (
        <p className="card-soft mt-6 p-4 text-sm" role="status">
          {aviso}
        </p>
      )}
      {painel.isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>}

      {aba === "visao" && t && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { rotulo: "Pacientes cadastrados", valor: String(t.pacientes) },
              { rotulo: "Profissionais cadastrados", valor: String(t.profissionais) },
              { rotulo: "Profissionais ativos", valor: String(t.profissionaisAtivos) },
              { rotulo: "Cadastros pendentes", valor: String(t.pendentes), destaque: t.pendentes > 0 },
              { rotulo: "Consultas futuras", valor: String(t.consultasFuturas) },
              { rotulo: "Consultas realizadas", valor: String(t.consultasRealizadas) },
              { rotulo: "Receita — taxas de agendamento", valor: moeda(t.receitaTaxasCentavos) },
              { rotulo: "Receita — comissão (realizadas)", valor: moeda(t.receitaComissaoCentavos) },
              { rotulo: "A pagar aos profissionais", valor: moeda(t.aPagarProfissionaisCentavos), destaque: t.aPagarProfissionaisCentavos > 0 },
              { rotulo: "Compras do livro", valor: `${t.livrosConfirmados} confirmada(s) · ${t.livrosPendentes} pendente(s)` },
            ].map((item) => (
              <div key={item.rotulo} className={`card-soft p-5 ${item.destaque ? "border-primary/50" : ""}`}>
                <p className="section-label">{item.rotulo}</p>
                <p className="mt-2 font-display text-2xl">{item.valor}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button type="button" className="card-soft p-5 text-left hover:border-primary/60" onClick={() => { setAba("profissionais"); setFiltroProf("pendente"); }}>
              <p className="font-semibold">Analisar cadastros pendentes</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.pendentes} profissional(is) aguardando validação.</p>
            </button>
            <button type="button" className="card-soft p-5 text-left hover:border-primary/60" onClick={() => setAba("financeiro")}>
              <p className="font-semibold">Repasses a pagar</p>
              <p className="mt-1 text-sm text-muted-foreground">{moeda(t.aPagarProfissionaisCentavos)} em consultas realizadas.</p>
            </button>
          </div>
        </>
      )}

      {aba === "pacientes" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Cadastro</th>
                <th className="p-3">Status</th>
                <th className="p-3">Consultas</th>
                <th className="p-3">Livro</th>
                <th className="p-3">Data da compra</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="p-3">
                    <p className="font-semibold">{u.nome ?? "—"}</p>
                    {u.codigo && <p className="text-xs text-muted-foreground">{u.codigo}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{dataBR(u.criadoEm)}</td>
                  <td className="p-3">{u.cadastroCompleto ? "Completo" : "Incompleto"}</td>
                  <td className="p-3">
                    {u.consultas} <span className="text-xs text-muted-foreground">({u.consultasRealizadas} realizadas)</span>
                  </td>
                  <td className="p-3">
                    <select
                      className="field-base py-1.5"
                      aria-label={`Status do livro de ${u.nome ?? u.email}`}
                      value={u.livroStatus}
                      onChange={async (e) => {
                        await mudarLivro({ data: { userId: u.id, status: e.target.value as typeof u.livroStatus } });
                        await atualizar();
                      }}
                    >
                      {Object.entries(rotuloLivro).map(([v, r]) => (
                        <option key={v} value={v}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {u.livroCompradoEm ? dataBR(u.livroCompradoEm) : u.livroClicadoEm ? `clique em ${dataBR(u.livroClicadoEm)}` : "—"}
                  </td>
                </tr>
              ))}
              {pacientes.length === 0 && !painel.isLoading && (
                <tr><td colSpan={7} className="p-4 text-muted-foreground">Nenhum paciente encontrado.</td></tr>
              )}
            </tbody>
          </table>
          <p className="p-3 text-xs text-muted-foreground">
            Os e-mails acima podem ser usados para comunicações e newsletter, respeitando o consentimento dado no cadastro.
          </p>
        </div>
      )}

      {aba === "profissionais" && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["pendente", "Em análise"],
                ["aprovado", "Aprovados"],
                ["rejeitado", "Rejeitados"],
                ["suspenso", "Suspensos"],
                ["todos", "Todos"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltroProf(id)}
                className={`pill ${filtroProf === id ? "bg-primary text-primary-foreground" : ""}`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {profissionais.map((p) => (
              <article key={p.id} className="card-soft p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg">{p.nome}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.profissao === "psiquiatra" ? "Psiquiatra" : "Psicólogo(a)"} · {p.registro} · {p.uf}
                      {p.cidade ? ` · ${p.cidade}` : ""} · {p.email_login ?? p.email_contato ?? "sem e-mail"} · cadastro em {dataBR(p.criadoEm)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Etapa atual: <strong className="text-foreground">{p.etapa.titulo}</strong> · {p.documentos.filter((d) => d.status === "aprovado").length}/{p.documentos.length} documentos aprovados · {p.consultas} consultas
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="pill">{rotuloStatusProf[p.status] ?? p.status}</span>
                    <span className="text-[11px] text-muted-foreground">{p.status === "aprovado" && p.temAgenda ? "Perfil ativo" : "Perfil inativo"}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <EtapasCadastro etapaAtual={p.etapa} compacto />
                </div>

                <button
                  type="button"
                  className="btn-base btn-ghost mt-4"
                  aria-expanded={aberto === p.id}
                  onClick={() => setAberto(aberto === p.id ? null : p.id)}
                >
                  {aberto === p.id ? "Fechar análise" : "Abrir análise"}
                </button>

                {aberto === p.id && (
                  <div className="mt-6 space-y-6">
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <Info rotulo="Contato" valor={[p.email_contato, p.telefone].filter(Boolean).join(" · ")} />
                      <Info rotulo="Valor da consulta / comissão" valor={`${moeda(p.valor_centavos)} · plataforma ${p.comissao_percent}%`} />
                      <Info rotulo="Graduação" valor={[p.graduacao, p.instituicao].filter(Boolean).join(" — ")} />
                      <Info rotulo="Abordagem" valor={p.abordagem} />
                      <Info rotulo="Formação" valor={p.formacao.join(", ")} />
                      <Info rotulo="Especializações" valor={p.especializacoes.join(", ")} />
                      <Info rotulo="Cursos relevantes" valor={p.cursos.join(", ")} />
                      <Info rotulo="Subtipos" valor={p.areas.join(", ")} />
                      <Info rotulo="Idiomas" valor={p.idiomas.join(", ")} />
                      <Info rotulo="Apresentação" valor={p.apresentacao} />
                      <Info rotulo="Experiência com TOC" valor={p.experiencia_toc} />
                      <Info rotulo="Última validação" valor={p.validado_em ? dataHoraBR(p.validado_em) : "—"} />
                    </dl>

                    <div>
                      <h3 className="text-base font-semibold">Documentos e títulos</h3>
                      {p.documentos.length === 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">Nenhum documento enviado até agora.</p>
                      )}
                      <ul className="mt-3 space-y-3">
                        {p.documentos.map((d) => (
                          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-sm">
                            <div>
                              <p className="font-semibold">{d.tipo}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.nome_arquivo} · {dataHoraBR(d.created_at)} · {rotuloDoc[d.status] ?? d.status}
                                {d.observacao_admin ? ` · ${d.observacao_admin}` : ""}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {d.url && (
                                <a href={d.url} target="_blank" rel="noreferrer" className="btn-base btn-ghost px-4 py-2">
                                  Abrir documento
                                </a>
                              )}
                              <select
                                className="field-base"
                                aria-label={`Situação do documento ${d.nome_arquivo}`}
                                value={d.status}
                                onChange={async (e) => {
                                  await mudarStatusDoc({ data: { id: d.id, status: e.target.value as "enviado" | "aprovado" | "recusado" } });
                                  await atualizar();
                                }}
                              >
                                <option value="enviado">Enviado</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="recusado">Recusado</option>
                              </select>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <label htmlFor={`obs-${p.id}`} className="section-label">
                        Observação da análise (visível ao profissional)
                      </label>
                      <textarea
                        id={`obs-${p.id}`}
                        rows={3}
                        className="field-base mt-2"
                        value={observacao[p.id] ?? p.observacao_admin ?? ""}
                        onChange={(e) => setObservacao({ ...observacao, [p.id]: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="btn-base btn-primary" onClick={() => aplicarStatus(p, "aprovado")}>
                        Aprovar e publicar
                      </button>
                      <button type="button" className="btn-base btn-ghost" onClick={() => aplicarStatus(p, "pendente", true)}>
                        Solicitar correção
                      </button>
                      <button type="button" className="btn-base btn-ghost" onClick={() => aplicarStatus(p, "pendente", false)}>
                        Voltar para análise
                      </button>
                      <button type="button" className="btn-base btn-ghost" onClick={() => aplicarStatus(p, "rejeitado")}>
                        Rejeitar
                      </button>
                      <button type="button" className="btn-base btn-ghost" onClick={() => aplicarStatus(p, "suspenso")}>
                        Suspender
                      </button>
                    </div>
                    {p.documentos.some((d) => d.status !== "aprovado") && (
                      <p className="text-xs text-muted-foreground">
                        Atenção: ainda há documentos não aprovados. O perfil só deve ser publicado após a aprovação de todos os requisitos.
                      </p>
                    )}

                    {p.historico.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold">Histórico de alterações</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                          {p.historico.map((h) => (
                            <li key={h.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-surface px-4 py-2">
                              <span>
                                {h.status_anterior ? `${rotuloStatusProf[h.status_anterior] ?? h.status_anterior} → ` : ""}
                                <strong>{rotuloStatusProf[h.status_novo] ?? h.status_novo}</strong>
                                {h.requer_correcao ? " (correção solicitada)" : ""}
                                {h.observacao ? ` — ${h.observacao}` : ""}
                              </span>
                              <span className="text-muted-foreground">{dataHoraBR(h.created_at)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <EdicaoProfissional
                      profissional={p}
                      salvar={async (dadosForm) => {
                        await editarProf({ data: { id: p.id, ...dadosForm } });
                        await atualizar();
                      }}
                    />
                  </div>
                )}
              </article>
            ))}
            {profissionais.length === 0 && !painel.isLoading && (
              <p className="card-soft p-6 text-sm text-muted-foreground">Nenhum profissional nesta situação.</p>
            )}
          </div>
        </>
      )}

      {aba === "consultas" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[64rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Profissional</th>
                <th className="p-3">Taxa</th>
                <th className="p-3">Consulta</th>
                <th className="p-3">Plataforma</th>
                <th className="p-3">Profissional recebe</th>
                <th className="p-3">Pagamento da taxa</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="p-3">{dataHoraBR(c.inicio)}</td>
                  <td className="p-3 font-semibold">{c.paciente}</td>
                  <td className="p-3">{c.profissional}</td>
                  <td className="p-3">{moeda(c.taxa_centavos)}</td>
                  <td className="p-3">{moeda(c.valor_consulta_centavos)}</td>
                  <td className="p-3">{moeda(c.valor_plataforma_centavos)}</td>
                  <td className="p-3">{c.status === "realizada" ? moeda(c.valor_profissional_centavos) : <span className="text-muted-foreground">após realizar</span>}</td>
                  <td className="p-3">
                    <select
                      className="field-base py-1.5"
                      aria-label={`Status do pagamento de ${c.paciente}`}
                      value={c.payment_status}
                      onChange={async (e) => {
                        await mudarPagamento({ data: { id: c.id, status: e.target.value as "pendente" | "aprovado" | "recusado" | "estornado" } });
                        await atualizar();
                      }}
                    >
                      {Object.entries(rotuloPagamento).filter(([v]) => v !== "cancelado").map(([v, r]) => (
                        <option key={v} value={v}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      className="field-base py-1.5"
                      aria-label={`Status da consulta de ${c.paciente}`}
                      value={c.status}
                      onChange={async (e) => {
                        await mudarConsulta({ data: { id: c.id, status: e.target.value as "confirmada" | "realizada" | "cancelada" | "nao_compareceu" | "aguardando_pagamento" } });
                        await atualizar();
                      }}
                    >
                      {["aguardando_pagamento", "confirmada", "realizada", "nao_compareceu", "cancelada"].map((v) => (
                        <option key={v} value={v}>{rotuloStatusConsulta[v]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {consultas.length === 0 && !painel.isLoading && (
                <tr><td colSpan={9} className="p-4 text-muted-foreground">Nenhuma consulta encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {aba === "financeiro" && t && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { rotulo: "Taxas de agendamento recebidas", valor: moeda(t.receitaTaxasCentavos) },
              { rotulo: "Comissão sobre realizadas", valor: moeda(t.receitaComissaoCentavos) },
              { rotulo: "A pagar aos profissionais", valor: moeda(t.aPagarProfissionaisCentavos) },
              { rotulo: "Já pago aos profissionais", valor: moeda(t.pagoProfissionaisCentavos) },
            ].map((i) => (
              <div key={i.rotulo} className="card-soft p-5">
                <p className="section-label">{i.rotulo}</p>
                <p className="mt-2 font-display text-2xl">{i.valor}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl">Pagamentos aos profissionais</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Um pagamento é gerado automaticamente quando a consulta é marcada como realizada.
              </p>
            </div>
            <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
              {(
                [
                  ["a_receber", "Valores a receber"],
                  ["historico", "Histórico de pagamentos"],
                  ["todos", "Todos"],
                ] as const
              ).map(([id, rotulo]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltroRepasse(id)}
                  className={`rounded-full px-3 py-1.5 ${filtroRepasse === id ? "bg-background font-semibold" : "text-muted-foreground"}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
          <div className="card-soft mt-4 overflow-x-auto p-2">
            <table className="w-full min-w-[64rem] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Profissional</th>
                  <th className="p-3">Consulta</th>
                  <th className="p-3">Pagamento previsto</th>
                  <th className="p-3">Bruto</th>
                  <th className="p-3">Plataforma</th>
                  <th className="p-3">Líquido</th>
                  <th className="p-3">Pix</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {repassesVisiveis.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="p-3 font-semibold">{r.profissional}</td>
                    <td className="p-3">{r.consultaInicio ? dataHoraBR(r.consultaInicio) : "—"}</td>
                    <td className="p-3">{r.previstoPara ? dataBR(r.previstoPara) : "—"}</td>
                    <td className="p-3">{moeda(r.bruto)}</td>
                    <td className="p-3 text-muted-foreground">{moeda(r.plataforma)}</td>
                    <td className="p-3 font-semibold">{moeda(r.liquido)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.chavePix ?? "não informado"}</td>
                    <td className="p-3">
                      <select
                        className="field-base py-1.5"
                        aria-label={`Status do repasse de ${r.profissional}`}
                        value={r.status}
                        onChange={async (e) => {
                          await mudarRepasse({ data: { id: r.id, status: e.target.value as "pendente" | "processando" | "pago" | "falhou" } });
                          await atualizar();
                        }}
                      >
                        {Object.entries(rotuloRepasse).map(([v, rot]) => (
                          <option key={v} value={v}>{rot}</option>
                        ))}
                      </select>
                      {r.pagoEm && <p className="mt-1 text-[11px] text-muted-foreground">pago em {dataBR(r.pagoEm)}</p>}
                    </td>
                  </tr>
                ))}
                {repassesVisiveis.length === 0 && !painel.isLoading && (
                  <tr><td colSpan={8} className="p-4 text-muted-foreground">Nenhum pagamento neste filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === "livro" && dados && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { rotulo: "Compras confirmadas", valor: String(t?.livrosConfirmados ?? 0) },
              { rotulo: "Pendentes de confirmação", valor: String(t?.livrosPendentes ?? 0) },
              { rotulo: "Desconto para pacientes", valor: `${dados.configuracoes.livroDescontoPercent}%` },
            ].map((i) => (
              <div key={i.rotulo} className="card-soft p-5">
                <p className="section-label">{i.rotulo}</p>
                <p className="mt-2 font-display text-2xl">{i.valor}</p>
              </div>
            ))}
          </div>
          <div className="card-soft mt-6 overflow-x-auto p-2">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Cadastro</th>
                  <th className="p-3">Status da compra</th>
                  <th className="p-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="p-3 font-semibold">{u.nome ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{dataBR(u.criadoEm)}</td>
                    <td className="p-3">{rotuloLivro[u.livroStatus]}</td>
                    <td className="p-3 text-muted-foreground">{u.livroCompradoEm ? dataBR(u.livroCompradoEm) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            A confirmação automática acontece pelo aviso de compra da Hotmart, cruzando o e-mail do comprador com o
            e-mail do cadastro. Configure o link com desconto na aba Configurações.
          </p>
        </>
      )}

      {aba === "configuracoes" && dados && (
        <FormularioConfiguracoes
          inicial={dados.configuracoes}
          salvar={async (cfg) => {
            const r = await salvarCfg({ data: cfg });
            setAviso(r.ok ? "Configurações salvas." : r.erro);
            await atualizar();
          }}
        />
      )}
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="section-label">{rotulo}</dt>
      <dd className="mt-1 leading-relaxed text-muted-foreground">{valor || "—"}</dd>
    </div>
  );
}

function FormularioConfiguracoes({
  inicial,
  salvar,
}: {
  inicial: ConfiguracoesPlataforma;
  salvar: (cfg: Partial<ConfiguracoesPlataforma>) => Promise<void>;
}) {
  const [cfg, setCfg] = useState(inicial);
  useEffect(() => setCfg(inicial), [inicial]);
  const num = (chave: keyof ConfiguracoesPlataforma, rotulo: string, dica: string, escala = 1) => (
    <label className="block text-sm">
      {rotulo}
      <input
        type="number"
        step="any"
        className="field-base mt-1"
        value={Number(cfg[chave]) / escala}
        onChange={(e) => setCfg({ ...cfg, [chave]: Math.round(Number(e.target.value) * escala) })}
      />
      <span className="mt-1 block text-xs text-muted-foreground">{dica}</span>
    </label>
  );
  return (
    <form
      className="card-soft mt-6 grid gap-5 p-7 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await salvar(cfg);
      }}
    >
      <h2 className="text-xl sm:col-span-2">Regras financeiras</h2>
       {num("taxaCentavos", "Sinal de agendamento (R$)", "Pago ao reservar e abatido do valor total da consulta.", 100)}
      {num("comissaoPercent", "Comissão da plataforma (%)", "Retida sobre o valor da consulta após a realização.")}
      {num("duracaoPadraoMinutos", "Duração padrão (minutos)", "Usada quando o profissional não define outra.")}
      {num("cancelamentoHoras", "Cancelamento sem custo até (horas antes)", "Prazo para o paciente cancelar com direito a estorno do sinal.")}
      {num("remarcacaoHoras", "Remarcação até (horas antes)", "Prazo mínimo para remarcar.")}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.reembolsoTaxaNoPrazo}
          onChange={(e) => setCfg({ ...cfg, reembolsoTaxaNoPrazo: e.target.checked })}
        />
        Estornar o sinal quando o cancelamento é feito dentro do prazo
      </label>

      <h2 className="mt-4 text-xl sm:col-span-2">Livro “Como Ser Feliz com TOC”</h2>
      <label className="block text-sm sm:col-span-2">
        Link da Hotmart com desconto
        <input
          type="url"
          className="field-base mt-1"
          placeholder="https://pay.hotmart.com/... (fornecido pela TOC Brazil)"
          value={cfg.hotmartLivroUrl}
          onChange={(e) => setCfg({ ...cfg, hotmartLivroUrl: e.target.value })}
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Enquanto vazio, o painel do paciente informa que o link será liberado em breve.
        </span>
      </label>
      <label className="block text-sm">
        Título do livro
        <input className="field-base mt-1" value={cfg.livroTitulo} onChange={(e) => setCfg({ ...cfg, livroTitulo: e.target.value })} />
      </label>
      {num("livroDescontoPercent", "Desconto para pacientes (%)", "Exibido no painel do paciente.")}
      <div className="sm:col-span-2">
        <button type="submit" className="btn-base btn-primary">
          Salvar configurações
        </button>
      </div>
    </form>
  );
}

function EdicaoProfissional({
  profissional,
  salvar,
}: {
  profissional: ProfissionalAdmin;
  salvar: (dados: Record<string, string | number | boolean>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    nome: profissional.nome,
    graduacao: profissional.graduacao ?? "",
    instituicao: profissional.instituicao ?? "",
    abordagem: profissional.abordagem ?? "",
    apresentacao: profissional.apresentacao ?? "",
    experiencia_toc: profissional.experiencia_toc ?? "",
    experiencia_anos: String(profissional.experiencia_anos ?? 0),
    comissao_percent: String(profissional.comissao_percent ?? 20),
    formacao: profissional.formacao.join(", "),
    especializacoes: profissional.especializacoes.join(", "),
    cursos: profissional.cursos.join(", "),
    areas: profissional.areas.join(", "),
    idiomas: profissional.idiomas.join(", "),
    foto_url: profissional.foto_url ?? "",
  });
  const [voltarParaAnalise, setVoltar] = useState(false);
  const [salvo, setSalvo] = useState(false);

  return (
    <form
      className="rounded-2xl bg-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSalvo(false);
        await salvar({
          ...form,
          experiencia_anos: Number(form.experiencia_anos) || 0,
          comissao_percent: Number(form.comissao_percent) || 25,
          voltarParaAnalise,
        });
        setSalvo(true);
      }}
    >
      <h3 className="text-base font-semibold">Editar informações do perfil</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(
          [
            ["nome", "Nome"],
            ["graduacao", "Graduação"],
            ["instituicao", "Instituição"],
            ["abordagem", "Abordagem"],
            ["experiencia_anos", "Anos de experiência"],
            ["comissao_percent", "Comissão da plataforma (%)"],
            ["formacao", "Formação (vírgulas)"],
            ["especializacoes", "Especializações (vírgulas)"],
            ["cursos", "Cursos relevantes (vírgulas)"],
            ["areas", "Subtipos (vírgulas)"],
            ["idiomas", "Idiomas (vírgulas)"],
            ["foto_url", "Endereço da foto"],
          ] as const
        ).map(([campo, rotulo]) => (
          <div key={campo}>
            <label htmlFor={`${campo}-${profissional.id}`} className="section-label">
              {rotulo}
            </label>
            <input
              id={`${campo}-${profissional.id}`}
              className="field-base mt-2"
              value={form[campo]}
              onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor={`apresentacao-${profissional.id}`} className="section-label">Apresentação</label>
          <textarea
            id={`apresentacao-${profissional.id}`}
            rows={3}
            className="field-base mt-2"
            value={form.apresentacao}
            onChange={(e) => setForm({ ...form, apresentacao: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`toc-${profissional.id}`} className="section-label">Experiência com TOC</label>
          <textarea
            id={`toc-${profissional.id}`}
            rows={3}
            className="field-base mt-2"
            value={form.experiencia_toc}
            onChange={(e) => setForm({ ...form, experiencia_toc: e.target.value })}
          />
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={voltarParaAnalise} onChange={(e) => setVoltar(e.target.checked)} />
        Devolver o perfil para nova análise antes de publicar esta versão
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn-base btn-primary">Salvar alterações</button>
        {salvo && <span className="text-sm font-semibold">Alterações salvas.</span>}
      </div>
    </form>
  );
}
