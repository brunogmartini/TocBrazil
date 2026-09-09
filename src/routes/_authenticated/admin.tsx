import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  definirStatusDocumento,
  definirStatusPagamento,
  definirStatusProfissional,
  editarProfissionalAdmin,
  painelAdmin,
  type ProfissionalAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — TOC Brazil" },
      {
        name: "description",
        content:
          "Controle de usuários cadastrados, consultas, status de pagamento e análise dos cadastros profissionais da TOC Brazil.",
      },
      { property: "og:title", content: "Painel do administrador — TOC Brazil" },
      {
        property: "og:description",
        content: "Gestão de usuários, consultas, pagamentos e aprovação de profissionais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const moeda = (centavos: number) => `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });

const rotuloPagamento: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  estornado: "Estornado",
  cancelado: "Cancelado",
};

const rotuloConsulta: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
  nao_compareceu: "Não compareceu",
};

const rotuloStatusProf: Record<string, string> = {
  pendente: "Aguardando análise",
  aprovado: "Aprovado e publicado",
  rejeitado: "Rejeitado",
  suspenso: "Suspenso",
};

const rotuloDoc: Record<string, string> = {
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

type Aba = "usuarios" | "consultas" | "profissionais";
type FiltroProf = "todos" | "pendente" | "aprovado" | "rejeitado" | "suspenso";

function Admin() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(painelAdmin);
  const mudarStatusProf = useServerFn(definirStatusProfissional);
  const mudarStatusDoc = useServerFn(definirStatusDocumento);
  const editarProf = useServerFn(editarProfissionalAdmin);
  const mudarPagamento = useServerFn(definirStatusPagamento);
  const [aba, setAba] = useState<Aba>("profissionais");
  const [busca, setBusca] = useState("");
  const [filtroProf, setFiltroProf] = useState<FiltroProf>("pendente");
  const [aberto, setAberto] = useState<string | null>(null);
  const [observacao, setObservacao] = useState<Record<string, string>>({});

  const painel = useQuery({ queryKey: ["painel-admin"], queryFn: () => carregar() });
  const atualizar = () => queryClient.invalidateQueries({ queryKey: ["painel-admin"] });

  if (painel.isError) {
    return (
      <div className="container-page py-20">
        <h1 className="text-3xl">Acesso restrito</h1>
        <p className="mt-3 text-muted-foreground">
          Esta área é exclusiva da administração da plataforma.
        </p>
        <Link to="/painel" className="btn-base btn-primary mt-6">
          Voltar para minha área
        </Link>
      </div>
    );
  }

  const dados = painel.data;
  const filtro = busca.trim().toLowerCase();

  const usuarios = (dados?.usuarios ?? []).filter(
    (u) =>
      !filtro ||
      (u.nome ?? "").toLowerCase().includes(filtro) ||
      (u.email ?? "").toLowerCase().includes(filtro),
  );
  const consultas = (dados?.consultas ?? []).filter(
    (c) =>
      !filtro ||
      c.paciente.toLowerCase().includes(filtro) ||
      c.profissional.toLowerCase().includes(filtro),
  );
  const profissionais = (dados?.profissionais ?? []).filter(
    (p) =>
      (!filtro || p.nome.toLowerCase().includes(filtro) || p.registro.toLowerCase().includes(filtro)) &&
      (filtroProf === "todos" || p.status === filtroProf),
  );

  async function aplicarStatus(
    p: ProfissionalAdmin,
    status: "pendente" | "aprovado" | "rejeitado" | "suspenso",
  ) {
    await mudarStatusProf({
      data: { id: p.id, status, observacao: observacao[p.id] ?? p.observacao_admin ?? "" },
    });
    await atualizar();
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Administração</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Painel de controle</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Análise dos cadastros profissionais, usuários, consultas e status de pagamento. Ao aprovar um
        profissional, o perfil é publicado automaticamente na página pública.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { rotulo: "Usuários", valor: String(dados?.totais.usuarios ?? 0) },
          { rotulo: "Profissionais", valor: String(dados?.totais.profissionais ?? 0) },
          { rotulo: "Aguardando análise", valor: String(dados?.totais.pendentes ?? 0) },
          { rotulo: "Consultas", valor: String(dados?.totais.consultas ?? 0) },
          { rotulo: "Recebido", valor: moeda(dados?.totais.recebidoCentavos ?? 0) },
        ].map((item) => (
          <div key={item.rotulo} className="card-soft p-5">
            <p className="section-label">{item.rotulo}</p>
            <p className="mt-2 font-display text-2xl">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 rounded-full bg-muted p-1 text-sm">
          {(
            [
              ["profissionais", "Profissionais"],
              ["usuarios", "Usuários"],
              ["consultas", "Consultas e pagamentos"],
            ] as const
          ).map(([id, rotulo]) => (
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
        <input
          className="field-base max-w-xs"
          placeholder="Buscar por nome, e-mail ou registro"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar"
        />
      </div>

      {painel.isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>}

      {aba === "profissionais" && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["pendente", "Pendentes"],
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
                      {p.profissao === "psiquiatra" ? "Psiquiatra" : "Psicólogo(a)"} · {p.registro} ·{" "}
                      {p.uf}
                      {p.cidade ? ` · ${p.cidade}` : ""} · cadastro em {dataHora(p.criadoEm)}
                    </p>
                  </div>
                  <span className="pill">{rotuloStatusProf[p.status] ?? p.status}</span>
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
                      <Info rotulo="Graduação" valor={[p.graduacao, p.instituicao].filter(Boolean).join(" — ")} />
                      <Info rotulo="Abordagem" valor={p.abordagem} />
                      <Info rotulo="Experiência" valor={`${p.experiencia_anos} anos declarados`} />
                      <Info rotulo="Formação" valor={p.formacao.join(", ")} />
                      <Info rotulo="Especializações" valor={p.especializacoes.join(", ")} />
                      <Info rotulo="Cursos relevantes" valor={p.cursos.join(", ")} />
                      <Info rotulo="Áreas de atuação" valor={p.areas.join(", ")} />
                      <Info rotulo="Idiomas" valor={p.idiomas.join(", ")} />
                      <Info rotulo="Apresentação" valor={p.apresentacao} />
                      <Info rotulo="Experiência com TOC" valor={p.experiencia_toc} />
                      <Info
                        rotulo="Última validação"
                        valor={p.validado_em ? dataHora(p.validado_em) : "—"}
                      />
                    </dl>

                    <div>
                      <h3 className="text-base font-semibold">Documentos enviados</h3>
                      {p.documentos.length === 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhum documento enviado até agora.
                        </p>
                      )}
                      <ul className="mt-3 space-y-3">
                        {p.documentos.map((d) => (
                          <li
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-sm"
                          >
                            <div>
                              <p className="font-semibold">{d.tipo}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.nome_arquivo} · {dataHora(d.created_at)} ·{" "}
                                {rotuloDoc[d.status] ?? d.status}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {d.url && (
                                <a
                                  href={d.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-base btn-ghost px-4 py-2"
                                >
                                  Abrir documento
                                </a>
                              )}
                              <select
                                className="field-base"
                                aria-label={`Situação do documento ${d.nome_arquivo}`}
                                value={d.status}
                                onChange={async (e) => {
                                  await mudarStatusDoc({
                                    data: {
                                      id: d.id,
                                      status: e.target.value as "enviado" | "aprovado" | "recusado",
                                    },
                                  });
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
                        onChange={(e) =>
                          setObservacao({ ...observacao, [p.id]: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="btn-base btn-primary"
                        onClick={() => aplicarStatus(p, "aprovado")}
                      >
                        Aprovar profissional
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-ghost"
                        onClick={() => aplicarStatus(p, "rejeitado")}
                      >
                        Rejeitar
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-ghost"
                        onClick={() => aplicarStatus(p, "pendente")}
                      >
                        Solicitar correções
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-ghost"
                        onClick={() => aplicarStatus(p, "suspenso")}
                      >
                        Suspender
                      </button>
                    </div>

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
              <p className="card-soft p-6 text-sm text-muted-foreground">
                Nenhum profissional nesta situação.
              </p>
            )}
          </div>
        </>
      )}

      {aba === "usuarios" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">Perfil</th>
                <th className="p-3">Consultas</th>
                <th className="p-3">Pago</th>
                <th className="p-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="p-3 font-semibold">{u.nome ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.telefone ?? "—"}</td>
                  <td className="p-3">{u.papeis.join(", ")}</td>
                  <td className="p-3">{u.consultas}</td>
                  <td className="p-3">{moeda(u.pagoCentavos)}</td>
                  <td className="p-3 text-muted-foreground">{dataHora(u.criadoEm)}</td>
                </tr>
              ))}
              {usuarios.length === 0 && !painel.isLoading && (
                <tr>
                  <td colSpan={7} className="p-4 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {aba === "consultas" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Profissional</th>
                <th className="p-3">Consulta</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="p-3">{dataHora(c.inicio)}</td>
                  <td className="p-3 font-semibold">{c.paciente}</td>
                  <td className="p-3">{c.profissional}</td>
                  <td className="p-3">{rotuloConsulta[c.status] ?? c.status}</td>
                  <td className="p-3">{rotuloPagamento[c.payment_status] ?? c.payment_status}</td>
                  <td className="p-3">{moeda(c.valor_centavos)}</td>
                  <td className="p-3">
                    <select
                      className="field-base"
                      aria-label={`Status do pagamento de ${c.paciente}`}
                      value={c.payment_status}
                      onChange={async (e) => {
                        await mudarPagamento({
                          data: {
                            id: c.id,
                            status: e.target.value as
                              | "pendente"
                              | "aprovado"
                              | "recusado"
                              | "estornado",
                          },
                        });
                        await atualizar();
                      }}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="recusado">Recusado</option>
                      <option value="estornado">Estornado</option>
                    </select>
                  </td>
                </tr>
              ))}
              {consultas.length === 0 && !painel.isLoading && (
                <tr>
                  <td colSpan={7} className="p-4 text-muted-foreground">
                    Nenhuma consulta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            ["formacao", "Formação (vírgulas)"],
            ["especializacoes", "Especializações (vírgulas)"],
            ["cursos", "Cursos relevantes (vírgulas)"],
            ["areas", "Áreas de atuação (vírgulas)"],
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
          <label htmlFor={`apresentacao-${profissional.id}`} className="section-label">
            Apresentação
          </label>
          <textarea
            id={`apresentacao-${profissional.id}`}
            rows={3}
            className="field-base mt-2"
            value={form.apresentacao}
            onChange={(e) => setForm({ ...form, apresentacao: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`toc-${profissional.id}`} className="section-label">
            Experiência com TOC
          </label>
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
        <input
          type="checkbox"
          checked={voltarParaAnalise}
          onChange={(e) => setVoltar(e.target.checked)}
        />
        Devolver o perfil para nova análise antes de publicar esta versão
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn-base btn-primary">
          Salvar alterações
        </button>
        {salvo && <span className="text-sm font-semibold">Alterações salvas.</span>}
      </div>
    </form>
  );
}
