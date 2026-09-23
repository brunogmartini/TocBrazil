import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { enviarMensagem, listarMensagens } from "@/lib/mensagens.functions";

function hora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Canal estritamente administrativo entre paciente e profissional.
 * Sem anexos e com aviso fixo no topo.
 */
export function ChatAdministrativo({ consultaId }: { consultaId: string }) {
  const carregar = useServerFn(listarMensagens);
  const enviar = useServerFn(enviarMensagem);
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmarTermos, setConfirmarTermos] = useState(false);

  const chave = ["mensagens", consultaId];
  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => carregar({ data: { consultaId } }),
    refetchInterval: 20000,
  });

  const papel = consulta.data?.papel ?? null;
  const mensagens = consulta.data?.mensagens ?? [];

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    const corpo = texto.trim();
    if (!corpo || enviando) return;
    setEnviando(true);
    setErro(null);
    const r = await enviar({ data: { consultaId, corpo, confirmarTermos } });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.erro);
      if ("requerConfirmacao" in r && r.requerConfirmacao) setConfirmarTermos(true);
      return;
    }
    setTexto("");
    setConfirmarTermos(false);
    await queryClient.invalidateQueries({ queryKey: chave });
  }

  return (
    <section className="rounded-xl border border-border/60 p-4">
      <h3 className="text-sm font-semibold">Mensagens</h3>
      <p className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Este canal é apenas para assuntos administrativos e não permite dados de contato. Não compartilhe informações de saúde por aqui.
      </p>

      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
        {consulta.isLoading && <p className="text-xs text-muted-foreground">Carregando…</p>}
        {!consulta.isLoading && mensagens.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma mensagem ainda. Use este espaço para remarcar, avisar um atraso ou tirar
            dúvida de pagamento.
          </p>
        )}
        {mensagens.map((m) => {
          const minha = m.autor_papel === papel;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                minha ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.corpo}</p>
              <p className={`mt-1 text-[11px] ${minha ? "opacity-80" : "text-muted-foreground"}`}>
                {m.autor_papel === "paciente" ? "Paciente" : "Profissional"} · {hora(m.created_at)}
              </p>
            </div>
          );
        })}
      </div>

      <form onSubmit={submeter} className="mt-3 space-y-2">
        <label className="sr-only" htmlFor={`msg-${consultaId}`}>
          Escreva sua mensagem administrativa
        </label>
        <textarea
          id={`msg-${consultaId}`}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setConfirmarTermos(false); setErro(null); }}
          maxLength={1000}
          rows={3}
          placeholder="Ex.: preciso remarcar para outro dia."
          className="w-full rounded-xl border border-border/60 bg-background p-3 text-sm"
        />
        {erro && <p className="text-xs text-destructive">{erro}</p>}
        <button type="submit" className="btn-base btn-primary" disabled={enviando || !texto.trim()}>
          {enviando ? "Enviando…" : confirmarTermos ? "Enviar mesmo assim" : "Enviar mensagem"}
        </button>
      </form>
    </section>
  );
}
