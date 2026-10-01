import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { publicContractDocuments } from "@/lib/contract.functions";

export const Route = createFileRoute("/contrato-profissional")({
  head: () => ({ meta: [
    { title: "Contrato profissional — TOC Brazil" },
    { name: "description", content: "Contrato e anexos vigentes para psicólogos cadastrados na TOC Brazil." },
    { property: "og:title", content: "Contrato profissional — TOC Brazil" },
    { property: "og:description", content: "Contrato e anexos vigentes para psicólogos cadastrados na TOC Brazil." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ContractPage,
});

function ContractPage() {
  return <main className="container-page py-14 lg:py-20"><h1 className="text-4xl">Contrato profissional e anexos</h1><ClientOnly fallback={<p className="mt-8 text-sm text-muted-foreground">Carregando documentos…</p>}><ContractDocuments /></ClientOnly></main>;
}

function ContractDocuments() {
  const load = useServerFn(publicContractDocuments);
  const { data, isLoading } = useQuery({ queryKey: ["public-contract-v63"], queryFn: () => load() });
  if (isLoading || !data) return <p className="mt-8 text-sm text-muted-foreground">Carregando documentos…</p>;
  return <><p className="section-label mt-4">Versão {data.version}</p><section className="mt-8 max-w-4xl"><h2 className="text-2xl">Em resumo</h2><p className="mt-4 leading-relaxed text-muted-foreground">{data.summary}</p></section><section className="mt-10 grid gap-4 sm:grid-cols-2">{data.documents.map((document) => <article key={document.key} className="card-soft p-6"><h2 className="text-lg">{document.name}</h2><p className="mt-2 break-all font-mono text-xs text-muted-foreground">SHA-256: {document.sha256}</p>{document.url ? <a className="btn-base btn-ghost mt-5" href={document.url} target="_blank" rel="noreferrer">Abrir PDF original</a> : <p className="mt-4 text-sm text-destructive">Arquivo indisponível.</p>}</article>)}</section></>;
}