import { lazy, Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { acceptProfessionalContract, professionalContractState, recordContractDocumentAccess } from "@/lib/contract.functions";

const ContractPdfViewer = lazy(() => import("@/components/contract-pdf-viewer"));

export function ContractAcceptance() {
  const queryClient = useQueryClient();
  const loadState = useServerFn(professionalContractState);
  const recordAccess = useServerFn(recordContractDocumentAccess);
  const accept = useServerFn(acceptProfessionalContract);
  const state = useQuery({ queryKey: ["professional-contract-v63"], queryFn: () => loadState() });
  const [scrollCompleted, setScrollCompleted] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(Array(7).fill(false));
  const [message, setMessage] = useState<string | null>(null);

  if (state.isLoading) return <div className="card-soft mt-5 p-7 text-sm text-muted-foreground">Carregando contrato…</div>;
  if (!state.data?.available) return <div className="card-soft mt-5 p-7"><p className="font-semibold">Documentos em análise</p><p className="mt-2 text-sm text-muted-foreground">O contrato será liberado depois que a equipe conferir seu cadastro e seus documentos.</p></div>;
  const contract = state.data.documents.find((document) => document.key === "contract");
  const annexes = state.data.documents.filter((document) => document.key !== "contract");
  const opened = new Set(state.data.openedAnnexes);
  const complete = scrollCompleted && annexes.every((document) => opened.has(document.key)) && checks.every(Boolean);

  if (state.data.acceptance) return <div className="card-soft mt-5 p-7"><p className="font-semibold">Contrato {state.data.version} assinado eletronicamente.</p><p className="mt-2 text-sm text-muted-foreground">Aceite registrado em {new Date(state.data.acceptance.accepted_at).toLocaleString("pt-BR")}.</p>{!state.data.receivingActive && <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed">Credenciamento aprovado. Estamos finalizando a integração de pagamentos e avisaremos assim que seu perfil for publicado.</p>}</div>;

  return <div className="card-soft mt-5 p-5 sm:p-7">
    <p className="text-sm font-semibold">Versão {state.data.version}</p>
    <h3 className="mt-2 text-xl">Em resumo</h3>
    <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">{state.data.summary}</p>
    {contract?.url ? <div className="mt-6">
      <ClientOnly fallback={<div className="h-[34rem] border border-border bg-muted p-6 text-sm text-muted-foreground">Abrindo contrato…</div>}>
        <Suspense fallback={<div className="h-[34rem] border border-border bg-muted p-6 text-sm text-muted-foreground">Abrindo contrato…</div>}>
          <ContractPdfViewer url={contract.url} onReachedEnd={() => setScrollCompleted(true)} />
        </Suspense>
      </ClientOnly>
      <p className="mt-2 text-xs text-muted-foreground">{scrollCompleted ? "Leitura até o fim registrada." : "Percorra o documento até a última página para continuar."}</p>
    </div> : <p className="mt-5 text-sm text-destructive">O contrato não pôde ser aberto agora.</p>}

    <div className="mt-7 border-t border-border pt-6">
      <h3 className="text-lg">Anexos obrigatórios</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{annexes.map((document) => <a key={document.key} href={document.url ?? undefined} target="_blank" rel="noreferrer" className="btn-base btn-ghost justify-between" aria-disabled={!document.url} onClick={async (event) => {
        if (!document.url) { event.preventDefault(); return; }
        const result = await recordAccess({ data: { documentKey: document.key as "annex_i" | "annex_iii" | "annex_iv" | "annex_v" } });
        if (!result.ok) { event.preventDefault(); setMessage(result.error); return; }
         await queryClient.invalidateQueries({ queryKey: ["professional-contract-v63"] });
      }}><span>{document.name}</span><span aria-hidden="true">{opened.has(document.key) ? "✓" : "↗"}</span></a>)}</div>
    </div>

    <fieldset className="mt-7 border-t border-border pt-6"><legend className="text-lg font-semibold">Declarações de aceite</legend>{!scrollCompleted && <p className="mt-3 text-sm text-muted-foreground">Role o contrato até o fim para habilitar o aceite.</p>}<div className="mt-4 space-y-3">{state.data.declarations.map((declaration, index) => <label key={declaration} className={`flex items-start gap-3 border p-4 text-sm leading-relaxed ${index === 2 || index === 6 ? "border-primary bg-primary/5" : "border-border"}`}><input className="mt-1" type="checkbox" disabled={!scrollCompleted} checked={checks[index]} onChange={(event) => setChecks(checks.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))} /><span>{declaration}</span></label>)}</div></fieldset>
    <dl className="mt-7 grid gap-3 border border-border bg-background p-4 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Nome</dt><dd className="font-semibold">{state.data.identity.name}</dd></div><div><dt className="text-muted-foreground">CPF</dt><dd className="font-semibold">{state.data.identity.cpf}</dd></div><div><dt className="text-muted-foreground">CRP</dt><dd className="font-semibold">{state.data.identity.crp} · {state.data.identity.uf}</dd></div></dl>
    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{state.data.signatureNotice}</p>
    {message && <p className="mt-4 text-sm text-destructive" role="alert">{message}</p>}
    <button type="button" className="btn-base btn-primary mt-6 disabled:opacity-50" disabled={!complete} onClick={async () => {
      setMessage(null);
      const result = await accept({ data: { scrollCompleted: true, declarations: checks } });
      if (!result.ok) return setMessage(result.error);
       await queryClient.invalidateQueries({ queryKey: ["professional-contract-v63"] });
      setMessage("Aceite eletrônico registrado com sucesso.");
    }}>Aceitar e assinar eletronicamente</button>
  </div>;
}