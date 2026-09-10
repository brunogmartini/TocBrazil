import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Modal } from "@/components/modal";
import {
  adicionarAnotacao,
  anotacoesDaConsulta,
  marcarConsultaRealizada,
  type ConsultaAgenda,
} from "@/lib/profissional.functions";
import { chaveDia, horaDe, rotuloDiaLongo } from "@/lib/agenda-tempo";
import { moeda, rotuloStatusConsulta } from "@/lib/video-sala";

export function ConsultaDetalhe({
  consulta,
  onFechar,
  onAtualizado,
}: {
  consulta: ConsultaAgenda | null;
  onFechar: () => void;
  onAtualizado: () => Promise<void> | void;
}) {
  const queryClient = useQueryClient();
  const carregarAnotacoes = useServerFn(anotacoesDaConsulta);
  const anotar = useServerFn(adicionarAnotacao);
  const atualizar = useServerFn(marcarConsultaRealizada);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const anotacoes = useQuery({
    queryKey: ["anotacoes", consulta?.id],
    queryFn: () => carregarAnotacoes({ data: { appointmentId: consulta!.id } }),
    enabled: Boolean(consulta),
  });

  if (!consulta) return null;
  const c = consulta;
  const futura = new Date(c.inicio).getTime() > Date.now();
  const podeAnotar = c.status === "confirmada" || c.status === "realizada";
  const liquido = Math.round(c.valor_consulta_centavos * 0.8);

  async function mudarStatus(status: "realizada" | "nao_compareceu" | "cancelada") {
    if (status === "cancelada" && !window.confirm("Cancelar esta consulta?")) return;
    setErro(null);
    const r = await atualizar({ data: { id: c.id, status } });
    if (!r.ok) setErro(r.erro);
    else await onAtualizado();
  }

  return (
    <Modal aberto titulo={`${horaDe(c.inicio)} — ${c.paciente}`} onFechar={onFechar}>
      <div className="space-y-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">{rotuloStatusConsulta[c.status] ?? c.status}</span>
          {c.codigo && <span className="pill">{c.codigo}</span>}
          <span className="text-muted-foreground">
            {rotuloDiaLongo(chaveDia(c.inicio))} · {horaDe(c.inicio)}–{horaDe(c.fim)} · {c.duracao_minutos} min
          </span>
        </div>

        <dl className="grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Valor da consulta</dt>
            <dd className="font-semibold">{moeda(c.valor_consulta_centavos)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Seu líquido {c.status === "realizada" ? "" : "(após realizar)"}</dt>
            <dd className="font-semibold">{moeda(c.valor_profissional_centavos || liquido)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Taxa de agendamento</dt>
            <dd className="font-semibold">
              {moeda(c.taxa_agendamento_centavos)}{" "}
              <span className="font-normal text-muted-foreground">
                ({c.payment_status === "aprovado" ? "paga" : "pendente"})
              </span>
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          {c.video_url && (c.status === "confirmada" || c.status === "realizada") && (
            <a href={c.video_url} target="_blank" rel="noopener noreferrer" className="btn-base btn-primary">
              Entrar na videochamada
            </a>
          )}
          {c.vinculado && (
            <Link
              to="/profissional/ficha/$patientId"
              params={{ patientId: c.patient_id }}
              className="btn-base btn-ghost"
            >
              Abrir ficha sigilosa
            </Link>
          )}
        </div>

        {c.status === "aguardando_pagamento" && (
          <p className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">
            O paciente ainda não pagou a taxa de agendamento. O horário fica reservado até a confirmação.
          </p>
        )}

        {podeAnotar && (
          <section>
            <h3 className="text-base">Anotações da consulta</h3>
            <ul className="mt-3 space-y-2">
              {(anotacoes.data?.anotacoes ?? []).length === 0 && (
                <li className="text-xs text-muted-foreground">Nenhuma anotação ainda.</li>
              )}
              {(anotacoes.data?.anotacoes ?? []).map((a) => (
                <li key={a.id} className="rounded-xl bg-muted p-3">
                  <p className="whitespace-pre-wrap">{a.conteudo}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </p>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setSalvando(true);
                setErro(null);
                const r = await anotar({ data: { appointmentId: c.id, conteudo: texto } });
                setSalvando(false);
                if (!r.ok) setErro(r.erro);
                else {
                  setTexto("");
                  await queryClient.invalidateQueries({ queryKey: ["anotacoes", c.id] });
                }
              }}
            >
              <textarea
                className="field-base"
                rows={3}
                maxLength={8000}
                placeholder="Registre observações desta sessão (sigiloso, visível só para você)."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <button type="submit" disabled={salvando || !texto.trim()} className="btn-base btn-primary disabled:opacity-60">
                {salvando ? "Salvando…" : "Adicionar anotação"}
              </button>
            </form>
          </section>
        )}

        {(c.status === "confirmada" || c.status === "aguardando_pagamento") && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {!futura && c.status === "confirmada" && (
              <>
                <button type="button" className="btn-base btn-ghost" onClick={() => mudarStatus("realizada")}>
                  Marcar como realizada
                </button>
                <button type="button" className="btn-base btn-ghost" onClick={() => mudarStatus("nao_compareceu")}>
                  Paciente não compareceu
                </button>
              </>
            )}
            <button type="button" className="btn-base btn-ghost" onClick={() => mudarStatus("cancelada")}>
              Cancelar consulta
            </button>
          </div>
        )}
        {erro && <p className="text-destructive">{erro}</p>}
      </div>
    </Modal>
  );
}
