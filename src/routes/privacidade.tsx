import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, legalDocumentsQuery } from "@/components/legal-page";

export const Route = createFileRoute("/privacidade")({
  loader: ({ context }) => context.queryClient.ensureQueryData(legalDocumentsQuery),
  head: () => ({
    meta: [
      { title: "Política de Privacidade e Proteção de Dados | TOC Brazil" },
      { name: "description", content: "Política de Privacidade da TOC Brazil: dados tratados, finalidade, direitos e contato do encarregado." },
      { property: "og:title", content: "Política de Privacidade | TOC Brazil" },
      { property: "og:description", content: "Saiba quais dados são tratados na TOC Brazil e como exercer seus direitos." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <LegalPage slug="privacidade" />
      <nav aria-label="Documentos relacionados" className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link to="/seguranca" className="btn-base btn-ghost">Como protegemos seus dados</Link>
        <Link to="/suporte" className="btn-base btn-ghost">Falar com o suporte</Link>
      </nav>
    </div>
  );
}