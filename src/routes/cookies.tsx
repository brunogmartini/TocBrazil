import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies | TOC Brazil" },
      {
        name: "description",
        content:
          "Quais cookies a TOC Brazil utiliza, para que servem e como você pode gerenciar suas preferências de cookies e medição de campanhas.",
      },
      { property: "og:title", content: "Política de Cookies da TOC Brazil" },
      {
        property: "og:description",
        content: "Cookies essenciais, de preferência e de medição — com controle do usuário.",
      },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: Cookies,
});

const tipos = [
  {
    t: "Essenciais",
    d: "Necessários para o funcionamento do site, autenticação e segurança da sessão. Não podem ser desativados.",
  },
  {
    t: "Preferências",
    d: "Guardam escolhas como filtros de busca e ajustes de exibição para melhorar sua experiência.",
  },
  {
    t: "Medição",
    d: "Ajudam a entender como as pessoas encontram a plataforma, incluindo parâmetros de campanha (UTM), de forma agregada.",
  },
];

function Cookies() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Institucional</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Política de Cookies</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Utilizamos cookies e tecnologias equivalentes para operar a plataforma com segurança,
        lembrar preferências e entender, de forma agregada, como as pessoas chegam até aqui.
      </p>

      <div className="mt-10 grid max-w-3xl gap-5">
        {tipos.map((t) => (
          <section key={t.t} className="card-soft p-6">
            <h2 className="text-lg">{t.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.d}</p>
          </section>
        ))}
      </div>

      <div className="card-soft mt-10 max-w-3xl p-6">
        <h2 className="text-lg">Gerenciar preferências</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Nesta versão não utilizamos cookies de publicidade nem compartilhamos dados com redes de
          anúncios. O painel de gestão de preferências será disponibilizado junto da autenticação,
          e você também pode controlar cookies pelas configurações do seu navegador.
        </p>
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
