import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { activeLegalDocuments } from "@/lib/legal.functions";
import { LegalDocument } from "./legal-document";
import { legalDocumentReady, legalSectionId, type LegalSlug } from "@/lib/legal";
export const legalDocumentsQuery = queryOptions({queryKey:["legal-documents-public"],queryFn:()=>activeLegalDocuments(),staleTime:0});
export function LegalPage({slug}:{slug:LegalSlug}) {
 const {data}=useSuspenseQuery(legalDocumentsQuery);const doc=data.find(d=>d.slug===slug);
 if(!doc) return <div className="container-page py-12"><h1 className="heading-page">Documento indisponível</h1><p className="mt-4">Tente novamente mais tarde.</p></div>;
 const sections=doc.content_md.split("\n").filter(line=>/^##\s/.test(line)).map(line=>line.replace(/^##\s+/,""));
 return <div className="container-page py-12 lg:py-16"><div className="max-w-3xl"><span className="section-label">Institucional</span><h1 className="heading-page mt-3">{doc.title}</h1><p className="mt-3 text-sm text-muted-foreground">Versão {doc.version} · Vigência: {new Date(doc.published_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})}</p>{!legalDocumentReady(doc.content_md)&&<p role="status" className="mt-6 text-muted-foreground">Texto oficial pendente. Esta versão ainda não está disponível para aceite e não substitui o contrato profissional.</p>}{sections.length>0&&<nav aria-label="Índice do documento" className="mt-8 border-y border-border py-5"><h2 className="text-lg font-semibold">Índice</h2><ul className="mt-3 space-y-2">{sections.map((s,i)=><li key={i}><a className="text-primary underline underline-offset-4" href={`#${legalSectionId(s)}`}>{s}</a></li>)}</ul></nav>}<LegalDocument text={doc.content_md}/></div></div>;
}