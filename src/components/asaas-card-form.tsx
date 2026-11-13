import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { iniciarPagamentoAsaas } from "@/lib/asaas.functions";
import { cpfValido, formatarCpf } from "@/lib/documento-pessoa";

export function AsaasCardForm({ consultaId, onSuccess }: { consultaId: string; onSuccess: () => void | Promise<void> }) {
  void onSuccess; // o retorno acontece pela página do Asaas (back_urls) + webhook
  const iniciar = useServerFn(iniciarPagamentoAsaas);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [precisaCpf, setPrecisaCpf] = useState(false);
  const [cpf, setCpf] = useState("");

  async function pagar() {
    setErro(null);
    if (precisaCpf && !cpfValido(cpf)) {
      setErro("CPF inválido. Confira os números e tente novamente.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await iniciar({
        data: { consultaId, metodo: "UNDEFINED", cpf: precisaCpf ? cpf : undefined },
      });
      if (resultado.ok && resultado.invoiceUrl) {
        // Página segura do Asaas: o paciente escolhe Pix ou cartão e paga lá.
        window.location.assign(resultado.invoiceUrl);
        return;
      }
      if (!resultado.ok && (resultado.codigo === "CPF_PENDENTE" || resultado.codigo === "CPF_INVALIDO")) {
        setPrecisaCpf(true);
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
      {precisaCpf && (
        <div>
          <label htmlFor="cpf-pagamento" className="text-sm font-medium">
            Seu CPF
          </label>
          <input
            id="cpf-pagamento"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            O CPF é exigido pelo provedor de pagamento para emitir a cobrança e fica salvo no seu perfil.
          </p>
        </div>
      )}
      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}
      <button className="btn-base btn-primary w-full" type="button" onClick={pagar} disabled={carregando}>
        {carregando ? "Abrindo pagamento…" : precisaCpf ? "Salvar CPF e pagar" : "Pagar consulta"}
      </button>
    </div>
  );
}
