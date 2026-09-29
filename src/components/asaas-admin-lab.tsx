import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { criarSubcontaTesteAsaas, executarAcaoTesteAsaas, listarTestesAsaasSandbox } from "@/lib/asaas-admin.functions";
import { moeda } from "@/lib/video-sala";

const initialAccount = { label: "Teste de split", name: "", email: "", cpfCnpj: "", birthDate: "", mobilePhone: "", incomeValue: "5000", postalCode: "", address: "", addressNumber: "", province: "", complement: "" };

export function AsaasAdminLab() {
  const queryClient = useQueryClient();
  const list = useServerFn(listarTestesAsaasSandbox);
  const createAccount = useServerFn(criarSubcontaTesteAsaas);
  const runAction = useServerFn(executarAcaoTesteAsaas);
  const query = useQuery({ queryKey: ["asaas-sandbox-tests"], queryFn: () => list(), refetchInterval: 15_000 });
  const [account, setAccount] = useState(initialAccount);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["asaas-sandbox-tests"] });
  const run = query.data?.runs.find((item) => item.id === selected) ?? query.data?.runs[0];

  return <section className="mt-6 space-y-6">
    <div className="border-l-4 border-primary bg-muted p-5">
      <p className="section-label">Ambiente isolado</p>
      <h2 className="mt-2 text-2xl">Testes Asaas Sandbox</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Este laboratório não libera pagamentos públicos e não usa pacientes, psicólogos ou consultas reais. Use somente dados e cartão de teste do Asaas.</p>
    </div>
    {message && <p className="card-soft p-4 text-sm" role="status">{message}</p>}

    <div className="grid gap-6 lg:grid-cols-2">
      <form className="card-soft p-6" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setMessage(null);
        try {
          const result = await createAccount({ data: { ...account, incomeValue: Number(account.incomeValue) } });
          if (result.ok) { setSelected(result.runId); setMessage(`Subconta criada. walletId: ${result.walletId}`); await refresh(); }
          else setMessage(result.erro);
        } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível executar o teste."); }
        finally { setBusy(false); }
      }}>
        <h3 className="text-lg">1. Criar subconta de teste</h3>
        <p className="mt-1 text-xs text-muted-foreground">O limite diário do Asaas Sandbox também se aplica.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Identificação do teste" value={account.label} onChange={(v) => setAccount({ ...account, label: v })} wide />
          <Input label="Nome fictício" value={account.name} onChange={(v) => setAccount({ ...account, name: v })} wide />
          <Input label="E-mail fictício" type="email" value={account.email} onChange={(v) => setAccount({ ...account, email: v })} />
          <Input label="CPF/CNPJ de teste" value={account.cpfCnpj} onChange={(v) => setAccount({ ...account, cpfCnpj: digits(v, 14) })} />
          <Input label="Nascimento" type="date" value={account.birthDate} onChange={(v) => setAccount({ ...account, birthDate: v })} />
          <Input label="Telefone de teste" value={account.mobilePhone} onChange={(v) => setAccount({ ...account, mobilePhone: digits(v, 13) })} />
          <Input label="Renda mensal (R$)" type="number" value={account.incomeValue} onChange={(v) => setAccount({ ...account, incomeValue: v })} />
          <Input label="CEP de teste" value={account.postalCode} onChange={(v) => setAccount({ ...account, postalCode: digits(v, 8) })} />
          <Input label="Endereço" value={account.address} onChange={(v) => setAccount({ ...account, address: v })} />
          <Input label="Número" value={account.addressNumber} onChange={(v) => setAccount({ ...account, addressNumber: v })} />
          <Input label="Bairro" value={account.province} onChange={(v) => setAccount({ ...account, province: v })} />
          <Input label="Complemento" required={false} value={account.complement} onChange={(v) => setAccount({ ...account, complement: v })} />
        </div>
        <button type="submit" className="btn-base btn-primary mt-5" disabled={busy}>{busy ? "Criando…" : "Criar subconta no Sandbox"}</button>
      </form>

      <div className="card-soft p-6">
        <h3 className="text-lg">2. Testar autorizações e split</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A coleta de cartão neste laboratório foi desativada. O Asaas não oferece tokenização direta no navegador com chave pública; o próximo fluxo usará uma página hospedada pelo próprio Asaas, após a validação das autorizações e do split.</p>
      </div>
    </div>

    <div>
      <h3 className="text-lg">3. Capturar, cancelar e conferir</h3>
      <div className="mt-4 space-y-3">
        {query.data?.runs.map((item) => <article key={item.id} className="card-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">walletId: {item.wallet_id ?? "aguardando"} · total {moeda(item.total_centavos)}</p></div><span className="pill">{item.last_action.replace(/_/g, " ")}</span></div>
          {item.failure_code && <p className="mt-3 text-sm text-destructive">Falha segura: {item.failure_code}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{(["A", "B"] as const).map((portion) => {
            const paymentId = portion === "A" ? item.payment_id_a : item.payment_id_b;
            const status = portion === "A" ? item.status_a : item.status_b;
            return <div key={portion} className="border-t border-border pt-3"><p className="text-sm font-semibold">Autorização {portion}: {status ?? "não criada"}</p><div className="mt-2 flex flex-wrap gap-2">{(["refresh", "capture", "cancel"] as const).map((action) => <button key={action} type="button" disabled={!paymentId || busy} className="btn-base btn-ghost px-3 py-2 text-xs" onClick={async () => { setBusy(true); try { const result = await runAction({ data: { runId: item.id, portion, action } }); setMessage(result.ok ? `Autorização ${portion}: ${result.status}.` : result.erro); await refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível executar o teste."); } finally { setBusy(false); } }}>{action === "refresh" ? "Atualizar" : action === "capture" ? "Capturar" : "Cancelar"}</button>)}</div></div>;
          })}</div>
        </article>)}
        {!query.isLoading && !query.data?.runs.length && <p className="text-sm text-muted-foreground">Nenhum teste executado ainda.</p>}
      </div>
    </div>
  </section>;
}

function digits(value: string, max: number) { return value.replace(/\D/g, "").slice(0, max); }
function Input({ label, value, onChange, type = "text", required = true, wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; wide?: boolean }) {
  return <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>{label}<input className="field-base mt-1" type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" /></label>;
}