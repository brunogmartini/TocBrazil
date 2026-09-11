import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  cancelarConsulta,
  meuContexto,
  meuLivro,
  minhasAvaliacoes,
  minhasConsultas,
  minhasNotificacoes,
  registrarInteresseLivro,
  salvarAvaliacao,
  salvarPerfil,
} from "@/lib/plataforma.functions";
import { CalendarioConsultas, type ItemCalendario } from "@/components/calendario-consultas";
import { Estrelas, SeletorEstrelas } from "@/components/estrelas";
import { Modal } from "@/components/modal";
import { iniciarPagamento } from "@/lib/pagamento.functions";
import { moeda, rotuloStatusConsulta } from "@/lib/video-sala";
import { horaDe, rotuloDiaLongo, chaveDia } from "@/lib/agenda-tempo";
import { exigirAreaPaciente } from "@/lib/role-access";

export const Route = createFileRoute("/_authenticated/painel")({
  beforeLoad: async ({ context }) => exigirAreaPaciente(context.user.id),
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
  return `${rotuloDiaLongo(chaveDia(iso))}, ${horaDe(iso)}`;
}

function Painel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const carregarContexto = useServerFn(meuContexto);
  const carregarConsultas = useServerFn(minhasConsultas);
  const carregarNotificacoes = useServerFn(minhasNotificacoes);
  const carregarLivro = useServerFn(meuLivro);
  const interesseLivro = useServerFn(registrarInteresseLivro);
  const salvar = useServerFn(salvarPerfil);
  const cancelar = useServerFn(cancelarConsulta);
  const carregarAvaliacoes = useServerFn(minhasAvaliacoes);
  const enviarAvaliacao = useServerFn(salvarAvaliacao);
  const pagar = useServerFn(iniciarPagamento);

  const contexto = useQuery({ queryKey: ["contexto"], queryFn: () => carregarContexto() });
  const consultas = useQuery({ queryKey: ["consultas"], queryFn: () => carregarConsultas() });
  const notificacoes = useQuery({ queryKey: ["notificacoes"], queryFn: () => carregarNotificacoes() });
  const avaliacoes = useQuery({ queryKey: ["minhas-avaliacoes"], queryFn: () => carregarAvaliacoes() });
  const livro = useQuery({ queryKey: ["livro"], queryFn: () => carregarLivro() });

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pg = params.get("pagamento");
    if (pg === "aprovado") setAviso("Pagamento aprovado. Sua consulta está confirmada.");
    if (pg === "pendente") setAviso("Pagamento em processamento. Avisaremos assim que for confirmado.");
    if (pg === "recusado") setAviso("O pagamento não foi aprovado. Você pode tentar novamente abaixo.");
  }, []);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { modo: "entrar" as const, redirect: undefined }, replace: true });
  }

  const perfil = contexto.data?.perfil;
  const perfilIncompleto = contexto.isSuccess && !perfil?.nome;
  const lista = consultas.data?.consultas ?? [];
  const agora = Date.now();
  const proximas = lista.filter(
    (c) => new Date(c.fim).getTime() > agora && c.status !== "cancelada" && c.status !== "realizada",
  );
  const historico = lista.filter(
    (c) => new Date(c.fim).getTime() <= agora || c.status === "cancelada" || c.status === "realizada",
  );
  const itensCalendario: ItemCalendario[] = lista
    .filter((c) => c.status !== "cancelada")
    .map((c) => ({
      id: c.id,
      inicio: c.inicio,
      fim: c.fim,
      titulo: c.professionals?.nome ?? "Consulta",
      status: c.status,
      videoUrl: c.video_url,
    }));
  const consultaSelecionada = lista.find((c) => c.id === selecionada) ?? null;

  const papeis = contexto.data?.papeis ?? [];

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Área do paciente</span>
          <h1 className="mt-3 text-3xl sm:text-4xl">
            Olá{perfil?.nome ? `, ${perfil.nome.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Suas consultas, o link da videochamada e seus lembretes ficam aqui.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {papeis.includes("admin") && (
            <Link to="/admin" className="btn-base btn-ghost">
              Painel do gestor
            </Link>
          )}
          {papeis.includes("profissional") && (
            <Link to="/profissional" className="btn-base btn-ghost">
              Consultório digital
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

      {aviso && (
        <p className="card-soft mt-6 border-primary/40 p-4 text-sm" role="status">
          {aviso}
        </p>
      )}

      {perfilIncompleto && (
        <div className="card-soft mt-8 flex flex-wrap items-center justify-between gap-4 border-primary/40 p-6">
          <div>
            <h2 className="text-lg">Complete seu cadastro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Precisamos apenas do seu nome para emitir recibos e identificar você para o profissional.
            </p>
          </div>
          <button type="button" className="btn-base btn-primary" onClick={() => setEditandoPerfil(true)}>
            Completar agora
          </button>
        </div>
      )}

       <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
           <section className="card-soft h-full p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl">Calendário de consultas</h2>
              <span className="text-xs text-muted-foreground">Toque em uma consulta para ver os detalhes</span>
            </div>
             <div className="mt-4">
              <CalendarioConsultas
                itens={itensCalendario}
                selecionado={selecionada}
                onSelecionar={(item) => setSelecionada(item.id)}
              />
            </div>
           </section>

          <section className="mt-12">
            <h2 className="text-xl">Próximas consultas</h2>
            {consultas.isLoading && <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>}
            {!consultas.isLoading && proximas.length === 0 && (
              <div className="card-soft mt-4 p-6">
                <p className="text-sm text-muted-foreground">Você ainda não tem consulta agendada.</p>
                <Link to="/profissionais" className="btn-base btn-primary mt-5">
                  Escolher profissional
                </Link>
              </div>
            )}
            <ul className="mt-4 space-y-4">
              {proximas.map((c) => (
                <li key={c.id} className="card-soft p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="pill">{rotuloStatusConsulta[c.status] ?? c.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.duracao_minutos} min · consulta {moeda(c.valor_consulta_centavos)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg">
                    {c.professionals?.nome} · {c.professionals?.profissao === "psiquiatra" ? "Psiquiatra" : "Psicólogo(a)"}
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

                  {c.status === "aguardando_pagamento" && (
                    <div className="mt-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      <p>
                        Para confirmar a reserva, pague o sinal de agendamento de{" "}
                        <strong className="text-foreground">{moeda(c.taxa_agendamento_centavos)}</strong>.
                        Esse valor faz parte da consulta de {moeda(c.valor_consulta_centavos)}. Restará{" "}
                        <strong className="text-foreground">
                          {moeda(Math.max(0, c.valor_consulta_centavos - c.taxa_agendamento_centavos))}
                        </strong>{" "}
                        para pagar no atendimento.
                      </p>
                      <button
                        type="button"
                        className="btn-base btn-primary mt-4"
                        onClick={async () => {
                          setErroPagamento(null);
                          const r = await pagar({ data: { consultaId: c.id, origem: window.location.origin } });
                          if (r.ok) window.location.href = r.link;
                          else setErroPagamento(r.erro);
                        }}
                      >
                        Pagar sinal com Mercado Pago
                      </button>
                      {erroPagamento && <p className="mt-3 text-destructive">{erroPagamento}</p>}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-base btn-ghost mt-5"
                    onClick={async () => {
                      if (!window.confirm("Deseja cancelar esta consulta?")) return;
                      const r = await cancelar({ data: { id: c.id } });
                      if (r.ok) await queryClient.invalidateQueries({ queryKey: ["consultas"] });
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
                  const feita = (avaliacoes.data?.avaliacoes ?? []).find((a) => a.appointment_id === c.id);
                  return (
                    <li key={c.id} className="card-soft p-5 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span>
                          {c.professionals?.nome} — {formatarData(c.inicio)}
                        </span>
                        <span className="text-muted-foreground">{rotuloStatusConsulta[c.status] ?? c.status}</span>
                      </div>
                       <dl className="mt-3 grid gap-2 rounded-xl bg-muted p-3 sm:grid-cols-3">
                         <div>
                           <dt className="text-xs text-muted-foreground">Valor total</dt>
                           <dd className="font-semibold">{moeda(c.valor_consulta_centavos)}</dd>
                         </div>
                         <div>
                           <dt className="text-xs text-muted-foreground">Sinal incluído</dt>
                           <dd className="font-semibold">{moeda(c.taxa_agendamento_centavos)}</dd>
                         </div>
                         <div>
                           <dt className="text-xs text-muted-foreground">Restante</dt>
                           <dd className="font-semibold">
                             {moeda(Math.max(0, c.valor_consulta_centavos - c.taxa_agendamento_centavos))}
                           </dd>
                         </div>
                       </dl>
                      {c.status === "realizada" && (
                        <FormularioAvaliacao
                          consultaId={c.id}
                          notaAtual={feita?.nota ?? 0}
                          comentarioAtual={feita?.comentario ?? ""}
                          onSalvar={async (nota, comentario) => {
                            const r = await enviarAvaliacao({ data: { consultaId: c.id, nota, comentario } });
                            if (r.ok) await queryClient.invalidateQueries({ queryKey: ["minhas-avaliacoes"] });
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
           <section className="card-soft min-h-full overflow-hidden p-6 lg:min-h-[26rem]">
            <span className="section-label">Benefício exclusivo</span>
            <h2 className="mt-2 text-xl">{livro.data?.titulo ?? "Como Ser Feliz com TOC"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pacientes cadastrados na TOC Brazil têm{" "}
              <strong className="text-foreground">{livro.data?.descontoPercent ?? 50}% de desconto</strong> na
              aquisição do livro.
            </p>
            {livro.data?.status === "confirmada" ? (
              <p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm">
                Compra confirmada. Boa leitura!
              </p>
            ) : livro.data?.url ? (
              <a
                href={livro.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-base btn-primary mt-5 w-full"
                onClick={async () => {
                  await interesseLivro();
                  await queryClient.invalidateQueries({ queryKey: ["livro"] });
                }}
              >
                Adquirir com {livro.data.descontoPercent}% de desconto
              </a>
            ) : (
              <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                O link com desconto será liberado em breve nesta área.
              </p>
            )}
            {livro.data?.status === "pendente" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Sua compra está pendente de confirmação. Assim que a Hotmart confirmar, avisaremos aqui.
              </p>
            )}
          </section>

          <section className="card-soft p-6">
            <h2 className="text-lg">Lembretes</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {(notificacoes.data?.notificacoes ?? []).length === 0 && (
                <li>Você verá aqui as confirmações e lembretes das suas consultas.</li>
              )}
              {(notificacoes.data?.notificacoes ?? []).slice(0, 6).map((n) => (
                <li key={n.id} className="rounded-xl bg-muted p-4">
                  <p className="font-semibold text-foreground">{n.titulo}</p>
                  <p className="mt-1">{n.corpo}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
            <span>
              {perfil?.nome ?? "Cadastro"} {perfil?.codigo_anonimo ? `· ${perfil.codigo_anonimo}` : ""}
            </span>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => setEditandoPerfil(true)}
            >
              Atualizar meus dados
            </button>
          </div>
        </aside>
      </div>

      <Modal aberto={editandoPerfil} titulo="Meus dados" onFechar={() => setEditandoPerfil(false)} largura="max-w-md">
        <FormularioPerfil
          nomeInicial={perfil?.nome ?? ""}
          telefoneInicial={perfil?.telefone ?? ""}
          nascimentoInicial={perfil?.data_nascimento ?? ""}
          onSalvar={async (dados) => {
            await salvar({ data: dados });
            await queryClient.invalidateQueries({ queryKey: ["contexto"] });
            setEditandoPerfil(false);
          }}
        />
      </Modal>

      <Modal
        aberto={Boolean(consultaSelecionada)}
        titulo="Detalhes da consulta"
        onFechar={() => setSelecionada(null)}
        largura="max-w-lg"
      >
        {consultaSelecionada && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="pill">{rotuloStatusConsulta[consultaSelecionada.status] ?? consultaSelecionada.status}</span>
              <span className="text-muted-foreground">{consultaSelecionada.duracao_minutos} minutos</span>
            </div>
            <div>
              <p className="text-lg">{consultaSelecionada.professionals?.nome}</p>
              <p className="text-muted-foreground">
                {consultaSelecionada.professionals?.registro} · {formatarData(consultaSelecionada.inicio)} às{" "}
                {horaDe(consultaSelecionada.fim)}
              </p>
            </div>
             <dl className="grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-3">
              <div>
                 <dt className="text-xs text-muted-foreground">Valor total da consulta</dt>
                 <dd className="font-semibold">{moeda(consultaSelecionada.valor_consulta_centavos)}</dd>
              </div>
              <div>
                 <dt className="text-xs text-muted-foreground">
                   Sinal de agendamento {consultaSelecionada.payment_status === "aprovado" ? "já pago" : "a pagar"}
                 </dt>
                 <dd className="font-semibold">{moeda(consultaSelecionada.taxa_agendamento_centavos)}</dd>
               </div>
               <div>
                 <dt className="text-xs text-muted-foreground">Restante no atendimento</dt>
                 <dd className="font-semibold">
                   {moeda(Math.max(0, consultaSelecionada.valor_consulta_centavos - consultaSelecionada.taxa_agendamento_centavos))}
                 </dd>
              </div>
            </dl>
            {consultaSelecionada.video_url && consultaSelecionada.status === "confirmada" && (
              <a
                href={consultaSelecionada.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-base btn-primary w-full"
              >
                Entrar na videochamada
              </a>
            )}
            {consultaSelecionada.status === "aguardando_pagamento" && (
              <p className="text-xs text-muted-foreground">
                 O link da videochamada é liberado assim que o sinal de agendamento for confirmado.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function FormularioPerfil({
  nomeInicial,
  telefoneInicial,
  nascimentoInicial,
  onSalvar,
}: {
  nomeInicial: string;
  telefoneInicial: string;
  nascimentoInicial: string;
  onSalvar: (d: { nome: string; telefone: string; data_nascimento: string | null }) => Promise<void>;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [nascimento, setNascimento] = useState(nascimentoInicial);
  const [salvando, setSalvando] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSalvando(true);
        await onSalvar({ nome, telefone, data_nascimento: nascimento || null });
        setSalvando(false);
      }}
    >
      <label className="block text-sm">
        Nome completo
        <input className="field-base mt-1" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} required />
      </label>
      <label className="block text-sm">
        Telefone (WhatsApp)
        <input className="field-base mt-1" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={30} />
      </label>
      <label className="block text-sm">
        Data de nascimento
        <input type="date" className="field-base mt-1" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
      </label>
      <button type="submit" disabled={salvando} className="btn-base btn-primary w-full disabled:opacity-60">
        {salvando ? "Salvando…" : "Salvar"}
      </button>
    </form>
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
        <button type="button" className="text-xs underline underline-offset-4" onClick={() => setAberto(true)}>
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
