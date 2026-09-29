import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Modal } from "@/components/modal";
import { ChatAdministrativo } from "@/components/chat-administrativo";

import { marcarConsultaRealizada, type ConsultaAgenda } from "@/lib/profissional.functions";
import { chaveDia, horaDe, rotuloDiaLongo } from "@/lib/agenda-tempo";
import { moeda, rotuloStatusConsulta } from "@/lib/video-sala";
import { registrarContinuidade } from "@/lib/continuidade.functions";

export function ConsultaDetalhe({
  consulta,
  onFechar,
  onAtualizado,
}: {
  consulta: ConsultaAgenda | null;
  onFechar: () => void;
  onAtualizado: () => Promise<void> | void;
}) {
  const atualizar = useServerFn(marcarConsultaRealizada);
  const registrarInteresse = useServerFn(registrarContinuidade);
  const [erro, setErro] = useState<string | null>(null);

  if (!consulta) return null;
  const c = consulta;
  const futura = new Date(c.inicio).getTime() > Date.now();

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
            <dt className="text-xs text-muted-foreground">Valor líquido para você</dt>
            <dd className="font-semibold">{moeda(c.valor_profissional_centavos)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Taxa fixa descontada</dt>
            <dd className="font-semibold">{moeda(c.taxa_plataforma_centavos)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pagamento do paciente</dt>
            <dd className="font-semibold">
              {c.payment_status === "aprovado" ? "confirmado" : "pendente"}
            </dd>
          </div>
        </dl>

        {c.link_acesso && (c.status === "confirmada" || c.status === "realizada") && (
          <a
            href={c.link_acesso}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-base btn-primary"
          >
            Abrir sua sala de atendimento
          </a>
        )}

        {c.status === "aguardando_pagamento" && (
          <p className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">
            O paciente ainda não concluiu o pagamento. O horário fica reservado por 15 minutos.
          </p>
        )}

        {(c.status === "confirmada" || c.status === "aguardando_pagamento") && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {!futura && c.status === "confirmada" && (
              <>
                <button type="button" className="btn-base btn-ghost" onClick={() => mudarStatus("realizada")}>
                  Confirmar que a consulta ocorreu
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
        {c.status === "realizada" && (
          <div className="border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">Use somente quando o paciente pediu espontaneamente para continuar com você.</p>
            <button type="button" className="btn-base btn-ghost mt-3" onClick={async () => {
              const r = await registrarInteresse({ data: { consultaId: c.id, valorCentavos: c.valor_consulta_centavos } });
              setErro(r.ok ? "Interesse registrado. A continuidade só será confirmada após novo pagamento do paciente." : r.erro);
            }}>Registrar interesse do paciente em continuar</button>
          </div>
        )}
        <ChatAdministrativo consultaId={c.id} />

      </div>
    </Modal>
  );
}
