import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies | TOC Brazil" },
      {
        name: "description",
        content:
          "Quais cookies necessários a TOC Brazil utiliza para manter sua sessão e o site funcionando.",
      },
      { property: "og:title", content: "Política de Cookies da TOC Brazil" },
      {
        property: "og:description",
        content: "Informações sobre os cookies necessários ao funcionamento da plataforma.",
      },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: Cookies,
});

const tipos = [
  {
    t: "Necessários",
    d: "Usados para o funcionamento do site, autenticação e segurança da sessão. Não podem ser desativados enquanto você usa esses recursos.",
  },
];

function Cookies() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <h1 className="heading-page mt-3">Política de Cookies</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Utilizamos cookies necessários para manter sua sessão ativa e o site funcionando.
      </p>

      <div className="mt-10 grid max-w-3xl gap-5">
        {tipos.map((t) => (
          <section key={t.t} className="card-soft p-6">
            <h2 className="heading-subsection">{t.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.d}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link to="/privacidade" className="btn-base btn-ghost">
          Privacidade e LGPD
        </Link>
        <Link to="/termos" className="btn-base btn-ghost">
          Termos de Uso
        </Link>
      </div>
    </div>
  );
}
