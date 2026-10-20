import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { iniciarPagamentoAsaas } from "@/lib/asaas.functions";

export function AsaasCardForm({ consultaId, onSuccess }: { consultaId: string; onSuccess: () => void | Promise<void> }) {
  void onSuccess; // o retorno acontece pela página do Asaas (back_urls) + webhook
  const iniciar = useServerFn(iniciarPagamentoAsaas);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function pagar() {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await iniciar({ data: { consultaId, metodo: "UNDEFINED" } });
      if (resultado.ok && resultado.invoiceUrl) {
        // Página segura do Asaas: o paciente escolhe Pix ou cartão e paga lá.
        window.location.assign(resultado.invoiceUrl);
        return;
      }
      setErro(resultado.erro ?? "Não foi possível abrir o pagamento agora.");
    } catch {
      setErro("Não foi possível abrir o pagamento agora.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Você será levado à página segura do Asaas para pagar com Pix ou cartão de crédito. Nenhum dado do cartão passa
        pela TOC Brazil.
      </p>
      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}
      <button className="btn-base btn-primary w-full" type="button" onClick={pagar} disabled={carregando}>
        {carregando ? "Abrindo pagamento…" : "Pagar consulta"}
      </button>
    </div>
  );
}
