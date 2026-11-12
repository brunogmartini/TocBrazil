import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { meusDadosRepasse, salvarDadosRepasse } from "@/lib/repasse.functions";
import { descreverRepasse, ROTULO_CHAVE_PIX, type MetodoRepasse, type TipoChavePix } from "@/lib/repasse";

export function RepasseForm() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(meusDadosRepasse);
  const salvar = useServerFn(salvarDadosRepasse);
  const atual = useQuery({ queryKey: ["dados-repasse"], queryFn: () => carregar() });
  const [form, setForm] = useState({ metodo: "pix" as MetodoRepasse, pixTipo: "cpf" as TipoChavePix, pixChave: "", bancoCodigo: "", agencia: "", conta: "", tipoConta: "corrente" as "corrente" | "poupanca", titularNome: "", titularDocumento: "" });
  const [editando, setEditando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const salvo = atual.data?.dados ?? null;

  useEffect(() => {
    if (!salvo) return;
    setForm({
      metodo: salvo.metodo, pixTipo: salvo.pix_tipo ?? "cpf", pixChave: salvo.pix_chave ?? "",
      bancoCodigo: salvo.banco_codigo ?? "", agencia: salvo.agencia ?? "", conta: salvo.conta ?? "",
      tipoConta: salvo.tipo_conta ?? "corrente", titularNome: salvo.titular_nome, titularDocumento: salvo.titular_documento,
    });
  }, [salvo]);

  if (atual.isPending) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!atual.data?.temCadastro) return <p className="max-w-xl text-sm text-muted-foreground">Salve seus dados profissionais acima para informar os dados para repasse.</p>;

  const mostrarFormulario = !salvo || editando;
  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setResultado(null);
    try {
      const r = await salvar({ data: form.metodo === "pix"
        ? { metodo: "pix", pixTipo: form.pixTipo, pixChave: form.pixChave, titularNome: form.titularNome, titularDocumento: form.titularDocumento }
        : { metodo: "banco", bancoCodigo: form.bancoCodigo, agencia: form.agencia, conta: form.conta, tipoConta: form.tipoConta, titularNome: form.titularNome, titularDocumento: form.titularDocumento } });
      if (r.ok) {
        setResultado({ ok: true, mensagem: "Dados salvos. A gestão vai conferir antes de liberar a agenda." });
        setEditando(false);
        await queryClient.invalidateQueries({ queryKey: ["dados-repasse"] });
        await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
      } else setResultado({ ok: false, mensagem: r.erro });
    } catch {
      setResultado({ ok: false, mensagem: "Não foi possível salvar agora. Tente novamente." });
    } finally { setSalvando(false); }
  }

  return (
    <div className="space-y-4">
      {salvo && !editando && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{descreverRepasse(salvo)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Titular: {salvo.titular_nome}</p>
          </div>
          <span className="pill">{salvo.conferido_em ? "Conferido pela gestão" : "Aguardando conferência"}</span>
          <button type="button" className="btn-base btn-ghost" onClick={() => { setEditando(true); setResultado(null); }}>Alterar dados</button>
        </div>
      )}
      {mostrarFormulario && (
        <form onSubmit={enviar} className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold">Como você quer receber</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="metodo" checked={form.metodo === "pix"} onChange={() => set("metodo", "pix")} /> Chave Pix</label>
              <label className="flex items-center gap-2"><input type="radio" name="metodo" checked={form.metodo === "banco"} onChange={() => set("metodo", "banco")} /> Conta bancária</label>
            </div>
          </fieldset>
          {form.metodo === "pix" ? (
            <>
              <label className="text-sm">Tipo da chave
                <select className="field-base mt-2" value={form.pixTipo} onChange={(e) => set("pixTipo", e.target.value)}>
                  {(Object.keys(ROTULO_CHAVE_PIX) as TipoChavePix[]).map((t) => <option key={t} value={t}>{ROTULO_CHAVE_PIX[t]}</option>)}
                </select>
              </label>
              <label className="text-sm">Chave Pix
                <input className="field-base mt-2" value={form.pixChave} onChange={(e) => set("pixChave", e.target.value)} required />
              </label>
            </>
          ) : (
            <>
              <label className="text-sm">Código do banco (3 dígitos)
                <input className="field-base mt-2" inputMode="numeric" maxLength={3} value={form.bancoCodigo} onChange={(e) => set("bancoCodigo", e.target.value)} required />
              </label>
              <label className="text-sm">Agência (sem dígito)
                <input className="field-base mt-2" inputMode="numeric" maxLength={5} value={form.agencia} onChange={(e) => set("agencia", e.target.value)} required />
              </label>
              <label className="text-sm">Conta com dígito
                <input className="field-base mt-2" placeholder="12345-6" value={form.conta} onChange={(e) => set("conta", e.target.value)} required />
              </label>
              <label className="text-sm">Tipo de conta
                <select className="field-base mt-2" value={form.tipoConta} onChange={(e) => set("tipoConta", e.target.value)}>
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </label>
            </>
          )}
          <label className="text-sm">Nome do titular
            <input className="field-base mt-2" value={form.titularNome} onChange={(e) => set("titularNome", e.target.value)} required />
          </label>
          <label className="text-sm">CPF ou CNPJ do titular
            <input className="field-base mt-2" inputMode="numeric" value={form.titularDocumento} onChange={(e) => set("titularDocumento", e.target.value)} required />
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-2">A conta precisa estar no seu CPF ou no CNPJ informado no cadastro. Ao alterar os dados, a gestão confere novamente.</p>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" className="btn-base btn-primary" disabled={salvando}>{salvando ? "Salvando…" : "Salvar dados para repasse"}</button>
            {salvo && <button type="button" className="btn-base btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>}
          </div>
        </form>
      )}
      {resultado && <p role={resultado.ok ? "status" : "alert"} className="border-l-4 border-primary bg-muted p-4 text-sm">{resultado.mensagem}</p>}
    </div>
  );
}
