import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  definirStatusPagamento,
  definirStatusProfissional,
  painelAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — TOC Brazil" },
      {
        name: "description",
        content:
          "Controle de usuários cadastrados, consultas, status de pagamento e aprovação de profissionais da TOC Brazil.",
      },
      { property: "og:title", content: "Painel do administrador — TOC Brazil" },
      {
        property: "og:description",
        content: "Gestão de usuários, consultas e pagamentos da TOC Brazil.",
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
  pendente: "Pendente",
  aprovado: "Aprovado",
  suspenso: "Suspenso",
};

type Aba = "usuarios" | "consultas" | "profissionais";

function Admin() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(painelAdmin);
  const mudarStatusProf = useServerFn(definirStatusProfissional);
  const mudarPagamento = useServerFn(definirStatusPagamento);
  const [aba, setAba] = useState<Aba>("usuarios");
  const [busca, setBusca] = useState("");

  const painel = useQuery({ queryKey: ["painel-admin"], queryFn: () => carregar() });

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
    (p) => !filtro || p.nome.toLowerCase().includes(filtro),
  );

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Administração</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Painel de controle</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Usuários cadastrados, consultas, status de pagamento e aprovação dos profissionais.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { rotulo: "Usuários", valor: String(dados?.totais.usuarios ?? 0) },
          { rotulo: "Profissionais", valor: String(dados?.totais.profissionais ?? 0) },
          { rotulo: "Consultas", valor: String(dados?.totais.consultas ?? 0) },
          { rotulo: "Aguardando pagamento", valor: String(dados?.totais.aguardandoPagamento ?? 0) },
          { rotulo: "Recebido", valor: moeda(dados?.totais.recebidoCentavos ?? 0) },
        ].map((item) => (
          <div key={item.rotulo} className="card-soft p-5">
            <p className="section-label">{item.rotulo}</p>
            <p className="mt-2 font-display text-2xl">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 rounded-full bg-muted p-1 text-sm">
          {(
            [
              ["usuarios", "Usuários"],
              ["consultas", "Consultas e pagamentos"],
              ["profissionais", "Profissionais"],
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
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar"
        />
      </div>

      {painel.isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>}

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
                        await queryClient.invalidateQueries({ queryKey: ["painel-admin"] });
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

      {aba === "profissionais" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Atuação</th>
                <th className="p-3">Registro</th>
                <th className="p-3">Consultas</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {profissionais.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="p-3 font-semibold">{p.nome}</td>
                  <td className="p-3">{p.profissao === "psiquiatra" ? "Psiquiatra" : "Psicólogo"}</td>
                  <td className="p-3 text-muted-foreground">
                    {p.registro} · {p.uf}
                  </td>
                  <td className="p-3">{p.consultas}</td>
                  <td className="p-3">{moeda(p.valor_centavos)}</td>
                  <td className="p-3">
                    <select
                      className="field-base"
                      aria-label={`Situação de ${p.nome}`}
                      value={p.status}
                      onChange={async (e) => {
                        await mudarStatusProf({
                          data: {
                            id: p.id,
                            status: e.target.value as "pendente" | "aprovado" | "suspenso",
                          },
                        });
                        await queryClient.invalidateQueries({ queryKey: ["painel-admin"] });
                      }}
                    >
                      {Object.entries(rotuloStatusProf).map(([valor, rotulo]) => (
                        <option key={valor} value={valor}>
                          {rotulo}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {profissionais.length === 0 && !painel.isLoading && (
                <tr>
                  <td colSpan={6} className="p-4 text-muted-foreground">
                    Nenhum profissional encontrado.
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
