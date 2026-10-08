import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { registrarEventoAutenticacao } from "@/lib/auth.functions";
import {
  cancelarConsulta,
  meuContexto,
  minhasConsultas,
  minhasNotificacoes,
  confirmarRealizacao,
  listarHorariosLivres,
  salvarPerfil,
} from "@/lib/plataforma.functions";
import { CalendarioConsultas, type ItemCalendario } from "@/components/calendario-consultas";
import { Modal } from "@/components/modal";
import { ChatAdministrativo } from "@/components/chat-administrativo";

import { moeda, rotuloStatusConsulta } from "@/lib/video-sala";
import { horaDe, rotuloDiaLongo, chaveDia } from "@/lib/agenda-tempo";
import { exigirAreaPaciente } from "@/lib/role-access";
import { baixarIcs } from "@/lib/calendario-ics";
import { institucional } from "@/config/institucional";
import { criarPreferenciaRecorrencia, remarcarConsulta, responderPesquisaPosConsulta } from "@/lib/continuidade.functions";
import { AttendanceConfirmation } from "@/components/attendance-confirmation";
import { AppointmentRoom } from "@/components/appointment-room";
import { AsaasCardForm } from "@/components/asaas-card-form";

export const Route = createFileRoute("/_authenticated/painel")({
  // Área exclusiva do paciente: profissionais e gestores são levados à sua própria área.
  beforeLoad: () => exigirAreaPaciente(),
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
  const registrarAuth = useServerFn(registrarEventoAutenticacao);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const carregarContexto = useServerFn(meuContexto);
  const carregarConsultas = useServerFn(minhasConsultas);
  const carregarNotificacoes = useServerFn(minhasNotificacoes);
  const salvar = useServerFn(salvarPerfil);
  const cancelar = useServerFn(cancelarConsulta);
  const confirmarConsulta = useServerFn(confirmarRealizacao);
  const pesquisar = useServerFn(responderPesquisaPosConsulta);
  const recorrencia = useServerFn(criarPreferenciaRecorrencia);
  const remarcar = useServerFn(remarcarConsulta);
  const buscarHorarios = useServerFn(listarHorariosLivres);

  const contexto = useQuery({ queryKey: ["contexto"], queryFn: () => carregarContexto() });
  const consultas = useQuery({ queryKey: ["consultas"], queryFn: () => carregarConsultas(), refetchInterval: 15_000 });
  const notificacoes = useQuery({ queryKey: ["notificacoes"], queryFn: () => carregarNotificacoes() });

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [remarcando, setRemarcando] = useState<{ id: string; slug: string } | null>(null);
  const [novosHorarios, setNovosHorarios] = useState<{ inicio: string; fim: string }[]>([]);
  const [reservaPagamentoId, setReservaPagamentoId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pg = params.get("pagamento");
    if (pg === "reservado") setAviso("Reserva confirmada. Nada foi debitado.");
    if (pg === "aprovado") setAviso("Pagamento aprovado. Sua consulta está confirmada.");
    if (pg === "pendente") setAviso("Pagamento em processamento. Avisaremos assim que for confirmado.");
    if (pg === "recusado") setAviso("O pagamento não foi aprovado. Você pode tentar novamente abaixo.");
  }, []);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await registrarAuth({ data: { evento: "logout", papel: "paciente" } });
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
    }));
  const consultaSelecionada = lista.find((c) => c.id === selecionada) ?? null;


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
              Precisamos do seu nome para identificar você para o profissional.
            </p>
          </div>
          <button type="button" className="btn-base btn-primary" onClick={() => setEditandoPerfil(true)}>
            Completar agora
          </button>
        </div>
      )}

       <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-[1.3fr_0.9fr]">
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
                    {c.professionals?.nome} · Psicólogo(a)
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{formatarData(c.inicio)}</p>

                  {c.status === "confirmada" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <AppointmentRoom id={c.id} inicio={c.inicio} fim={c.fim} paymentStatus={c.payment_status} releaseMinutes={c.antecedenciaLinkMinutos} />
                      <button
                        type="button"
                        className="btn-base btn-ghost"
                        onClick={() =>
                          baixarIcs({
                            id: c.id,
                            inicio: c.inicio,
                            fim: c.fim,
                            profissional: c.professionals?.nome ?? "profissional",
                          })
                        }
                      >
                        Adicionar ao meu calendário
                      </button>
                      {c.professionals?.slug && <button type="button" className="btn-base btn-ghost" onClick={async () => {
                        const livres = await buscarHorarios({ data: { slug: c.professionals?.slug ?? "", dias: 60 } });
                        setNovosHorarios(livres.horarios);
                        setRemarcando({ id: c.id, slug: c.professionals?.slug ?? "" });
                      }}>Remarcar</button>}
                    </div>
                  )}

                  <AttendanceConfirmation id={c.id} inicio={c.inicio} status={c.status} attendanceStatus={c.attendance_status} patientConfirmedAt={c.patient_confirmed_at} professionalConfirmedAt={c.professional_confirmed_at} side="paciente" onUpdated={() => queryClient.invalidateQueries({ queryKey: ["consultas"] })} />
                  {c.status === "aguardando_pagamento" && institucional.pagamentosAtivos && (
                    <div className="mt-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                      <p>
                         Seu horário fica reservado por 15 minutos. Para confirmar, reserve no cartão o valor
                         de <strong className="text-foreground">{moeda(c.valor_consulta_centavos)}</strong>.
                      </p>
                      <button
                        type="button"
                        className="btn-base btn-primary mt-4"
                         onClick={() => { setErroPagamento(null); setReservaPagamentoId(c.id); }}
                      >
                         Reservar no cartão
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
                  return (
                    <li key={c.id} className="card-soft p-5 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span>
                          {c.professionals?.nome} — {formatarData(c.inicio)}
                        </span>
                        <span className="text-muted-foreground">{rotuloStatusConsulta[c.status] ?? c.status}</span>
                      </div>
                      <dl className="mt-3 grid gap-2 rounded-xl bg-muted p-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-muted-foreground">Valor da consulta</dt>
                          <dd className="font-semibold">{moeda(c.valor_consulta_centavos)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Pagamento</dt>
                          <dd className="font-semibold">
                             {c.settlement_status === "EXECUTADO" && c.amount_captured_centavos > 0
                               ? `Cobrado ${moeda(c.amount_captured_centavos)}`
                               : c.auth_status_a === "AUTHORIZED"
                                 ? "Reservado"
                                 : c.payment_status === "cancelado" || c.payment_status === "estornado"
                                   ? "Reserva liberada"
                                   : "Pendente"}
                          </dd>
                        </div>
                      </dl>
                      {c.status === "realizada" && <div className="mt-4 border-t border-border/60 pt-4">
                        <p className="text-sm font-semibold">Você gostaria de continuar com este profissional?</p>
                        <div className="mt-3 flex flex-wrap gap-2">{([['sim','Sim'],['ainda_nao_sei','Ainda não sei'],['nao','Não']] as const).map(([resposta, rotulo]) => <button key={resposta} type="button" className="pill" onClick={async () => { const r = await pesquisar({ data: { consultaId: c.id, resposta } }); setAviso(r.ok ? "Resposta registrada. Obrigado." : r.erro); }}>{rotulo}</button>)}</div>
                         <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="btn-base btn-ghost" onClick={async () => { const r = await recorrencia({ data: { consultaId: c.id, frequencia: 'semanal' } }); setAviso(r.ok ? "Preferência semanal registrada. Cada horário exigirá confirmação e pagamento." : r.erro); }}>Preferência semanal</button></div>
                         <p className="mt-3 text-xs text-muted-foreground">O profissional fornece a nota fiscal (CNPJ) ou o recibo Receita Saúde (CPF) pelo valor total da consulta. Solicite o documento diretamente a ele durante o atendimento.</p>
                      </div>}
                      {(c.status === "confirmada" || c.status === "realizada") && <AppointmentRoom id={c.id} inicio={c.inicio} fim={c.fim} paymentStatus={c.payment_status} releaseMinutes={c.antecedenciaLinkMinutos} />}
                      <AttendanceConfirmation id={c.id} inicio={c.inicio} status={c.status} attendanceStatus={c.attendance_status} patientConfirmedAt={c.patient_confirmed_at} professionalConfirmedAt={c.professional_confirmed_at} side="paciente" onUpdated={() => queryClient.invalidateQueries({ queryKey: ["consultas"] })} />

                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

         <aside className="flex h-full flex-col gap-8">
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
      <Modal aberto={Boolean(remarcando)} titulo="Escolha o novo horário" onFechar={() => setRemarcando(null)} largura="max-w-lg">
        <div className="max-h-80 space-y-2 overflow-y-auto">{novosHorarios.slice(0, 40).map((slot) => <button key={slot.inicio} type="button" className="btn-base btn-ghost w-full justify-between" onClick={async () => { if (!remarcando) return; const r = await remarcar({ data: { consultaId: remarcando.id, novoInicio: slot.inicio } }); setAviso(r.ok ? "Consulta remarcada." : r.erro); if (r.ok) { setRemarcando(null); await queryClient.invalidateQueries({ queryKey: ['consultas'] }); } }}>{formatarData(slot.inicio)}</button>)}</div>
      </Modal>
      <Modal aberto={Boolean(reservaPagamentoId)} titulo="Reservar horário" onFechar={() => setReservaPagamentoId(null)} largura="max-w-lg">
        {reservaPagamentoId && <AsaasCardForm consultaId={reservaPagamentoId} onSuccess={async () => {
          setReservaPagamentoId(null);
          setAviso("Reserva confirmada. Nada foi debitado.");
          await queryClient.invalidateQueries({ queryKey: ["consultas"] });
        }} />}
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
            <dl className="grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Valor da consulta</dt>
                <dd className="font-semibold">{moeda(consultaSelecionada.valor_consulta_centavos)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Pagamento</dt>
                <dd className="font-semibold">
                  {consultaSelecionada.payment_status === "aprovado" ? "Aprovado" : "Pendente"}
                </dd>
              </div>
            </dl>
            {consultaSelecionada.status === "confirmada" &&
              (consultaSelecionada.linkLiberado && consultaSelecionada.link_acesso ? (
                <div className="space-y-3">
                  <a
                    href={consultaSelecionada.link_acesso}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-base btn-primary w-full"
                  >
                    Entrar na sala do profissional
                  </a>
                  {consultaSelecionada.professionals?.ferramenta_instrucoes && (
                    <p className="rounded-xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
                      {consultaSelecionada.professionals.ferramenta_provedor
                        ? `${consultaSelecionada.professionals.ferramenta_provedor}: `
                        : ""}
                      {consultaSelecionada.professionals.ferramenta_instrucoes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  O endereço da sala do profissional aparece aqui{" "}
                  {consultaSelecionada.antecedenciaLinkMinutos} minutos antes do horário e continua
                  disponível até 2 horas depois do fim da consulta.
                </p>
              ))}
            {consultaSelecionada.status === "confirmada" && (
              <button
                type="button"
                className="btn-base btn-ghost w-full"
                onClick={() =>
                  baixarIcs({
                    id: consultaSelecionada.id,
                    inicio: consultaSelecionada.inicio,
                    fim: consultaSelecionada.fim,
                    profissional: consultaSelecionada.professionals?.nome ?? "profissional",
                  })
                }
              >
                Adicionar ao meu calendário
              </button>
            )}
            {consultaSelecionada.status === "aguardando_pagamento" && (
              <p className="text-xs text-muted-foreground">
                O endereço da sala é liberado depois que o pagamento da consulta for aprovado.
              </p>
            )}
            <ChatAdministrativo consultaId={consultaSelecionada.id} />
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

