import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  cancelarConsulta,
  meuContexto,
  minhasConsultas,
  minhasNotificacoes,
  salvarPerfil,
} from "@/lib/plataforma.functions";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — TOC Brazil" },
      { name: "description", content: "Suas consultas, lembretes e dados na TOC Brazil." },
      { property: "og:title", content: "Meu painel — TOC Brazil" },
      { property: "og:description", content: "Acompanhe suas consultas online na TOC Brazil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

const rotuloStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
  nao_compareceu: "Não compareceu",
};

function Painel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const carregarContexto = useServerFn(meuContexto);
  const carregarConsultas = useServerFn(minhasConsultas);
  const carregarNotificacoes = useServerFn(minhasNotificacoes);
  const salvar = useServerFn(salvarPerfil);
  const cancelar = useServerFn(cancelarConsulta);

  const contexto = useQuery({ queryKey: ["contexto"], queryFn: () => carregarContexto() });
  const consultas = useQuery({ queryKey: ["consultas"], queryFn: () => carregarConsultas() });
  const notificacoes = useQuery({
    queryKey: ["notificacoes"],
    queryFn: () => carregarNotificacoes(),
  });

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const perfil = contexto.data?.perfil;
    if (perfil) {
      setNome(perfil.nome ?? "");
      setTelefone(perfil.telefone ?? "");
    }
  }, [contexto.data]);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { modo: "entrar" }, replace: true });
  }

  const perfilIncompleto = !contexto.data?.perfil?.nome;
  const lista = consultas.data?.consultas ?? [];
  const proximas = lista.filter(
    (c) => new Date(c.inicio) > new Date() && c.status !== "cancelada",
  );
  const historico = lista.filter(
    (c) => new Date(c.inicio) <= new Date() || c.status === "cancelada",
  );

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Minha área</span>
          <h1 className="mt-3 text-3xl sm:text-4xl">
            Olá{contexto.data?.perfil?.nome ? `, ${contexto.data.perfil.nome.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Aqui ficam suas consultas, lembretes e dados de cadastro.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/profissionais" className="btn-base btn-primary">
            Agendar consulta
          </Link>
          <button type="button" onClick={sair} className="btn-base btn-ghost">
            Sair
          </button>
        </div>
      </div>

      {perfilIncompleto && (
        <div className="card-soft mt-8 border-primary/40 p-6">
          <h2 className="text-lg">Complete seu cadastro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pedimos apenas o mínimo necessário para agendamento e emissão de recibo.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
          <section>
            <h2 className="text-xl">Próximas consultas</h2>
            {consultas.isLoading && <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>}
            {!consultas.isLoading && proximas.length === 0 && (
              <div className="card-soft mt-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem consulta agendada.
                </p>
                <Link to="/profissionais" className="btn-base btn-primary mt-5">
                  Escolher um especialista
                </Link>
              </div>
            )}
            <ul className="mt-4 space-y-4">
              {proximas.map((c) => (
                <li key={c.id} className="card-soft p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="pill">{rotuloStatus[c.status] ?? c.status}</span>
                    <span className="text-sm text-muted-foreground">
                      R$ {(c.valor_centavos / 100).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg">
                    {c.professionals?.nome} · {c.professionals?.profissao}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{formatarData(c.inicio)}</p>
                  {c.status === "aguardando_pagamento" && (
                    <p className="mt-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      Sua reserva está guardada. A consulta é confirmada assim que o pagamento for
                      aprovado — o meio de pagamento ainda está sendo conectado à plataforma.
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn-base btn-ghost mt-5"
                    onClick={async () => {
                      const r = await cancelar({ data: { id: c.id } });
                      if (r.ok) {
                        await queryClient.invalidateQueries({ queryKey: ["consultas"] });
                      }
                    }}
                  >
                    Cancelar consulta
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {historico.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl">Histórico</h2>
              <ul className="mt-4 space-y-3">
                {historico.map((c) => (
                  <li key={c.id} className="card-soft flex flex-wrap justify-between gap-2 p-5 text-sm">
                    <span>
                      {c.professionals?.nome} — {formatarData(c.inicio)}
                    </span>
                    <span className="text-muted-foreground">
                      {rotuloStatus[c.status] ?? c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-8">
          <section className="card-soft p-6">
            <h2 className="text-lg">Meus dados</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await salvar({ data: { nome, telefone } });
                setSalvo(true);
                await queryClient.invalidateQueries({ queryKey: ["contexto"] });
              }}
            >
              <label className="block text-sm">
                Nome completo
                <input
                  className="field-base mt-1"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={120}
                  required
                />
              </label>
              <label className="block text-sm">
                Telefone (WhatsApp)
                <input
                  className="field-base mt-1"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  maxLength={30}
                />
              </label>
              <button type="submit" className="btn-base btn-primary w-full">
                Salvar
              </button>
              {salvo && <p className="text-sm text-muted-foreground">Dados atualizados.</p>}
            </form>
          </section>

          <section className="card-soft p-6">
            <h2 className="text-lg">Lembretes</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {(notificacoes.data?.notificacoes ?? []).length === 0 && (
                <li>Você verá aqui as confirmações e lembretes das suas consultas.</li>
              )}
              {(notificacoes.data?.notificacoes ?? []).map((n) => (
                <li key={n.id} className="rounded-xl bg-muted p-4">
                  <p className="font-semibold text-foreground">{n.titulo}</p>
                  <p className="mt-1">{n.corpo}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
