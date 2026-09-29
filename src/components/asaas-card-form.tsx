import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reservarComAsaas } from "@/lib/asaas.functions";

export function AsaasCardForm({ consultaId, onSuccess }: { consultaId: string; onSuccess: () => void | Promise<void> }) {
  const reservar = useServerFn(reservarComAsaas);
  const [form, setForm] = useState({ nomeTitular: "", numero: "", mes: "", ano: "", ccv: "", cpfCnpj: "", cep: "", numeroEndereco: "", telefone: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      setErro(null);
      setEnviando(true);
      try {
        const result = await reservar({ data: { consultaId, ...form } });
        if (!result.ok) return setErro(result.erro);
        await onSuccess();
      } catch {
        setErro("Não foi possível concluir a reserva agora.");
      } finally {
        setEnviando(false);
      }
    }}>
      <p className="text-sm text-muted-foreground">O valor é reservado no seu cartão agora e cobrado depois da consulta.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome no cartão" value={form.nomeTitular} onChange={(v) => update("nomeTitular", v)} className="sm:col-span-2" autoComplete="cc-name" />
        <Field label="Número do cartão" value={form.numero} onChange={(v) => update("numero", v.replace(/\D/g, "").slice(0, 19))} className="sm:col-span-2" inputMode="numeric" autoComplete="cc-number" />
        <Field label="Mês" value={form.mes} onChange={(v) => update("mes", v.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" autoComplete="cc-exp-month" />
        <Field label="Ano" value={form.ano} onChange={(v) => update("ano", v.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-exp-year" />
        <Field label="Código de segurança" value={form.ccv} onChange={(v) => update("ccv", v.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" />
        <Field label="CPF ou CNPJ do titular" value={form.cpfCnpj} onChange={(v) => update("cpfCnpj", v.replace(/\D/g, "").slice(0, 14))} inputMode="numeric" />
        <Field label="CEP" value={form.cep} onChange={(v) => update("cep", v.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="postal-code" />
        <Field label="Número do endereço" value={form.numeroEndereco} onChange={(v) => update("numeroEndereco", v)} autoComplete="address-line2" />
        <Field label="Telefone" value={form.telefone} onChange={(v) => update("telefone", v.replace(/\D/g, "").slice(0, 13))} inputMode="tel" autoComplete="tel" />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Os dados do cartão são enviados com conexão segura ao Asaas e não ficam armazenados na TOC Brazil.</p>
      {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
      <button className="btn-base btn-primary w-full" type="submit" disabled={enviando}>{enviando ? "Reservando…" : "Reservar horário"}</button>
    </form>
  );
}

function Field({ label, value, onChange, className = "", inputMode, autoComplete }: { label: string; value: string; onChange: (value: string) => void; className?: string; inputMode?: "numeric" | "tel"; autoComplete?: string }) {
  return <label className={`block text-sm ${className}`}>{label}<input required className="field-base mt-1" value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} autoComplete={autoComplete} /></label>;
}