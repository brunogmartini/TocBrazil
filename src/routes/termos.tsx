import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, legalDocumentsQuery } from "@/components/legal-page";

export const Route = createFileRoute("/termos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(legalDocumentsQuery),
  head: () => ({
    meta: [
      { title: "Termos de Uso | TOC Brazil" },
      { name: "description", content: "Termos de Uso da plataforma TOC Brazil: busca de psicólogos, cadastro, responsabilidades e privacidade." },
      { property: "og:title", content: "Termos de Uso | TOC Brazil" },
      { property: "og:description", content: "Condições de uso e responsabilidades da plataforma TOC Brazil." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/termos" },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: Termos,
});

function Termos() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <LegalPage slug="termos-de-uso" />
      <nav aria-label="Documentos relacionados" className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link to="/privacidade" className="btn-base btn-ghost">Política de Privacidade</Link>
        <Link to="/cookies" className="btn-base btn-ghost">Política de Cookies</Link>
      </nav>
    </div>
  );
}