import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  marcarConsultaRealizada,
  minhaAgendaProfissional,
} from "@/lib/profissional.functions";

export const Route = createFileRoute("/_authenticated/profissional/")({
  head: () => ({
    meta: [
      { title: "Área do profissional — TOC Brazil" },
      {
        name: "description",
        content: "Suas consultas, sua agenda e seus ganhos na TOC Brazil.",
      },
      { property: "og:title", content: "Área do profissional — TOC Brazil" },
      { property: "og:description", content: "Consultas, agenda e ganhos em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelProfissional,
});

const rotuloStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
  nao_compareceu: "Não compareceu",
};

const rotuloCadastro: Record<string, string> = {
  pendente: "Em análise",
  aprovado: "Perfil publicado",
  suspenso: "Perfil suspenso",
};

function moeda(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function PainelProfissional() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(minhaAgendaProfissional);
  const atualizar = useServerFn(marcarConsultaRealizada);

  const dados = useQuery({ queryKey: ["agenda-profissional"], queryFn: () => carregar() });

  const prof = dados.data?.profissional ?? null;
  const consultas = dados.data?.consultas ?? [];
  const agora = new Date();
  const proximas = consultas.filter(
    (c) => new Date(c.inicio) > agora && c.status !== "cancelada",
  );
  const passadas = consultas.filter(
    (c) => new Date(c.inicio) <= agora || c.status === "cancelada",
  );

  async function mudarStatus(id: string, status: "realizada" | "nao_compareceu" | "cancelada") {
    await atualizar({ data: { id, status } });
    await queryClient.invalidateQueries({ queryKey: ["agenda-profissional"] });
  }

  if (dados.isLoading) {
    return <div className="container-page py-16 text-muted-foreground">Carregando…</div>;
  }

  if (!prof) {
    return (
      <div className="container-page py-16">
        <span className="section-label">Área do profissional</span>
        <h1 className="mt-3 text-3xl sm:text-4xl">Vamos começar seu cadastro</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Preencha seus dados profissionais e envie os documentos para verificação. Depois disso
          você define sua agenda e seu perfil fica disponível para agendamentos.
        </p>
        <Link to="/profissional/cadastro" className="btn-base btn-primary mt-8">
          Preencher meu cadastro
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Área do profissional</span>
          <h1 className="mt-3 text-3xl sm:text-4xl">{prof.nome}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rotuloCadastro[prof.status] ?? prof.status} · consultas de {prof.slot_minutos} minutos
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/profissional/agenda" className="btn-base btn-primary">
            Minha agenda
          </Link>
          <Link to="/profissional/cadastro" className="btn-base btn-ghost">
            Meu cadastro
          </Link>
        </div>
      </div>

      {prof.status !== "aprovado" && (
        <div className="card-soft mt-8 p-6">
          <p className="text-sm font-semibold">
            {prof.status === "pendente"
              ? "Seu cadastro está em análise."
              : "Seu perfil está suspenso."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {prof.status === "pendente"
              ? "Assim que os documentos forem verificados, seu perfil é publicado e você começa a receber agendamentos."
              : "Entre em contato com o suporte para entender as pendências e reativar seu perfil."}
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <div className="card-soft p-6">
          <p className="section-label">A receber</p>
          <p className="mt-2 font-display text-2xl">
            {moeda(dados.data?.ganhos?.previstoCentavos ?? 0)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Consultas agendadas e ainda não repassadas.
          </p>
        </div>
        <div className="card-soft p-6">
          <p className="section-label">Já recebido</p>
          <p className="mt-2 font-display text-2xl">
            {moeda(dados.data?.ganhos?.recebidoCentavos ?? 0)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Pagamentos aprovados até agora.</p>
        </div>
        <div className="card-soft p-6">
          <p className="section-label">Próximas consultas</p>
          <p className="mt-2 font-display text-2xl">{proximas.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sua parte é de {100 - Number(prof.comissao_percent ?? 30)}% do valor da consulta.
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl">Próximas consultas</h2>
        {proximas.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma consulta agendada no momento.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {proximas.map((c) => (
              <li key={c.id} className="card-soft p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="pill">{rotuloStatus[c.status] ?? c.status}</span>
                  <span className="text-sm font-semibold">
                    {moeda(c.valor_profissional_centavos ?? 0)} para você
                  </span>
                </div>
                <p className="mt-4 text-sm">
                  {(c.profiles as { nome: string | null } | null)?.nome ?? "Paciente"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{dataHora(c.inicio)}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => mudarStatus(c.id, "realizada")}
                    className="btn-base btn-ghost"
                  >
                    Marcar como realizada
                  </button>
                  <button
                    type="button"
                    onClick={() => mudarStatus(c.id, "nao_compareceu")}
                    className="btn-base btn-ghost"
                  >
                    Paciente não compareceu
                  </button>
                  <button
                    type="button"
                    onClick={() => mudarStatus(c.id, "cancelada")}
                    className="btn-base btn-ghost"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Histórico</h2>
        {passadas.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nada por aqui ainda.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {passadas.map((c) => (
              <li key={c.id} className="card-soft flex flex-wrap justify-between gap-3 p-5 text-sm">
                <span>{dataHora(c.inicio)}</span>
                <span className="text-muted-foreground">
                  {(c.profiles as { nome: string | null } | null)?.nome ?? "Paciente"} ·{" "}
                  {rotuloStatus[c.status] ?? c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
