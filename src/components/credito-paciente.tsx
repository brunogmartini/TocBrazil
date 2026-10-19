import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { meuSaldoCredito, solicitarReembolsoCredito } from "@/lib/asaas.functions";
import { moeda } from "@/lib/video-sala";

const ORIGEM_ROTULO: Record<string, string> = {
  no_show_pix: "Consulta não realizada (Pix)",
  no_show_cartao: "Consulta não realizada (cartão)",
  ajuste_manual: "Ajuste",
};

const STATUS_ROTULO: Record<string, string> = {
  disponivel: "Disponível",
  reembolsando: "Reembolso em andamento",
  reembolsado: "Reembolsado",
  cancelado: "Cancelado",
};

export function CreditoPaciente() {
  const carregarSaldo = useServerFn(meuSaldoCredito);
  const pedirReembolso = useServerFn(solicitarReembolsoCredito);
  const queryClient = useQueryClient();
  const [processando, setProcessando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["credito-paciente"],
    queryFn: () => carregarSaldo(),
  });

  const saldo = data?.saldoCentavos ?? 0;
  const creditos = data?.creditos ?? [];
  if (!creditos.length) return null;

  async function reembolsar(creditoId: string) {
    setProcessando(creditoId);
    setAviso(null);
    try {
      const r = await pedirReembolso({ data: { creditoId } });
      setAviso(r.ok ? "Reembolso solicitado. O valor volta pelo mesmo meio de pagamento." : r.erro);
      if (r.ok) await queryClient.invalidateQueries({ queryKey: ["credito-paciente"] });
    } catch {
      setAviso("Não foi possível solicitar o reembolso agora.");
    } finally {
      setProcessando(null);
    }
  }

  return (
    <section className="rounded-lg border p-4" aria-label="Crédito na plataforma">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Crédito na plataforma</h3>
        <span className="font-semibold">{moeda(saldo)}</span>
      </div>
      {aviso && (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {aviso}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {creditos.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {ORIGEM_ROTULO[c.origin] ?? c.origin} — {moeda(c.amount_centavos)}
              <span className="ml-2 opacity-70">({STATUS_ROTULO[c.status] ?? c.status})</span>
            </span>
            {c.status === "disponivel" && (
              <button
                type="button"
                className="btn-base btn-ghost"
                disabled={processando === c.id}
                onClick={() => reembolsar(c.id)}
              >
                {processando === c.id ? "Solicitando…" : "Reembolsar"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
