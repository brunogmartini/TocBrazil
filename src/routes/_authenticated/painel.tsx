import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  cancelarConsulta,
  meuContexto,
  minhasAvaliacoes,
  minhasConsultas,
  minhasNotificacoes,
  salvarAvaliacao,
  salvarPerfil,
} from "@/lib/plataforma.functions";
import { CalendarioConsultas } from "@/components/calendario-consultas";
import { Estrelas, SeletorEstrelas } from "@/components/estrelas";
import { iniciarPagamento } from "@/lib/pagamento.functions";

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
  const carregarAvaliacoes = useServerFn(minhasAvaliacoes);
  const enviarAvaliacao = useServerFn(salvarAvaliacao);
  const pagar = useServerFn(iniciarPagamento);

  const contexto = useQuery({ queryKey: ["contexto"], queryFn: () => carregarContexto() });
  const consultas = useQuery({ queryKey: ["consultas"], queryFn: () => carregarConsultas() });
  const notificacoes = useQuery({
    queryKey: ["notificacoes"],
    queryFn: () => carregarNotificacoes(),
  });
  const avaliacoes = useQuery({
    queryKey: ["minhas-avaliacoes"],
    queryFn: () => carregarAvaliacoes(),
  });

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);

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
    navigate({ to: "/auth", search: { modo: "entrar" as const, redirect: undefined }, replace: true });
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
          <span className="section-label">Área do paciente</span>
          <h1 className="mt-3 text-3xl sm:text-4xl">
            Olá{contexto.data?.perfil?.nome ? `, ${contexto.data.perfil.nome.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Aqui ficam suas consultas, lembretes e dados de cadastro.
          </p>
        </div>
        <div className="flex gap-3">
          {(contexto.data?.papeis ?? []).includes("admin") && (
            <Link to="/admin" className="btn-base btn-ghost">
              Painel do administrador
            </Link>
          )}
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
            <h2 className="text-xl">Calendário de consultas</h2>
            <div className="mt-4">
              <CalendarioConsultas
                itens={lista
                  .filter((c) => c.status !== "cancelada")
                  .map((c) => ({
                    id: c.id,
                    inicio: c.inicio,
                    titulo: c.professionals?.nome ?? "Consulta",
                    status: c.status,
                  }))}
              />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-xl">Próximas consultas</h2>
            {consultas.isLoading && <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>}
            {!consultas.isLoading && proximas.length === 0 && (
              <div className="card-soft mt-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem consulta agendada.
                </p>
                <Link to="/profissionais" className="btn-base btn-primary mt-5">
                  Escolher profissional com experiência em TOC
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
                  {c.video_url && c.status === "confirmada" && (
                    <a
                      href={c.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-base btn-primary mt-4"
                    >
                      Entrar na videochamada
                    </a>
                  )}
                  {c.video_url && c.status === "aguardando_pagamento" && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      O link da videochamada fica ativo aqui quando a consulta for confirmada.
                    </p>
                  )}
                  {c.status === "aguardando_pagamento" && (
                    <div className="mt-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      <p>
                        Sua reserva está guardada por tempo limitado. A consulta é confirmada assim
                        que o pagamento for aprovado.
                      </p>
                      <button
                        type="button"
                        className="btn-base btn-primary mt-4"
                        onClick={async () => {
                          setErroPagamento(null);
                          const r = await pagar({
                            data: { consultaId: c.id, origem: window.location.origin },
                          });
                          if (r.ok) window.location.href = r.link;
                          else setErroPagamento(r.erro);
                        }}
                      >
                        Pagar com Mercado Pago
                      </button>
                      {erroPagamento && (
                        <p className="mt-3 text-destructive">{erroPagamento}</p>
                      )}
                    </div>
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
                {historico.map((c) => {
                  const feita = (avaliacoes.data?.avaliacoes ?? []).find(
                    (a) => a.appointment_id === c.id,
                  );
                  return (
                    <li key={c.id} className="card-soft p-5 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span>
                          {c.professionals?.nome} — {formatarData(c.inicio)}
                        </span>
                        <span className="text-muted-foreground">
                          {rotuloStatus[c.status] ?? c.status}
                        </span>
                      </div>
                      {c.status === "realizada" && (
                        <FormularioAvaliacao
                          consultaId={c.id}
                          notaAtual={feita?.nota ?? 0}
                          comentarioAtual={feita?.comentario ?? ""}
                          onSalvar={async (nota, comentario) => {
                            const r = await enviarAvaliacao({
                              data: { consultaId: c.id, nota, comentario },
                            });
                            if (r.ok) {
                              await queryClient.invalidateQueries({
                                queryKey: ["minhas-avaliacoes"],
                              });
                            }
                            return r.ok ? null : r.erro;
                          }}
                        />
                      )}
                    </li>
                  );
                })}
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

function FormularioAvaliacao({
  consultaId,
  notaAtual,
  comentarioAtual,
  onSalvar,
}: {
  consultaId: string;
  notaAtual: number;
  comentarioAtual: string;
  onSalvar: (nota: number, comentario: string) => Promise<string | null>;
}) {
  const [aberto, setAberto] = useState(notaAtual === 0);
  const [nota, setNota] = useState(notaAtual);
  const [comentario, setComentario] = useState(comentarioAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!aberto) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
        <Estrelas nota={notaAtual} />
        <span className="text-xs text-muted-foreground">Sua avaliação foi registrada.</span>
        <button
          type="button"
          className="text-xs underline underline-offset-4"
          onClick={() => setAberto(true)}
        >
          Alterar
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-4 space-y-3 border-t border-border/60 pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (nota < 1) {
          setErro("Escolha de 1 a 5 estrelas.");
          return;
        }
        setSalvando(true);
        const falha = await onSalvar(nota, comentario);
        setSalvando(false);
        setErro(falha);
        if (!falha) setAberto(false);
      }}
    >
      <p className="text-sm font-semibold text-foreground">Como foi sua consulta?</p>
      <SeletorEstrelas valor={nota} onChange={setNota} />
      <label className="block text-sm" htmlFor={`comentario-${consultaId}`}>
        Comentário (opcional)
        <textarea
          id={`comentario-${consultaId}`}
          className="field-base mt-1"
          rows={3}
          maxLength={800}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </label>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <button type="submit" disabled={salvando} className="btn-base btn-primary disabled:opacity-60">
        {salvando ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
