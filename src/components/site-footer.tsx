import { Link } from "@tanstack/react-router";

const colunas = [
  {
    titulo: "Pacientes",
    links: [
      { to: "/profissionais", label: "Encontrar profissional" },
      { to: "/como-funciona", label: "Como funciona" },
      { to: "/conteudos", label: "Conteúdos" },
      { to: "/meu-cuidado", label: "Minhas consultas" },
    ],
  },
  {
    titulo: "Profissionais",
    links: [
      { to: "/para-psicologos", label: "Sou psicólogo" },
      { to: "/para-psiquiatras", label: "Sou psiquiatra" },
      { to: "/cadastro-profissional", label: "Cadastro" },
      { to: "/meu-cuidado", label: "Login" },
    ],
  },
  {
    titulo: "Institucional",
    links: [
      { to: "/entenda-o-toc", label: "Sobre o TOC" },
      { to: "/termos", label: "Termos de Uso" },
      { to: "/privacidade", label: "Privacidade e LGPD" },
      { to: "/cookies", label: "Cookies" },
    ],
  },
  {
    titulo: "Confiança",
    links: [
      { to: "/seguranca", label: "Segurança" },
      { to: "/privacidade", label: "Seus direitos" },
      { to: "/suporte", label: "Suporte" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface pb-20 text-surface-foreground lg:pb-0">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="logo-mark" />
            <span className="font-display text-lg">Clarea</span>
          </div>
          <p className="mt-4 font-display text-base">Do entendimento ao cuidado.</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Plataforma especializada em TOC que reúne informação confiável e acesso a
            profissionais de Psicologia e Psiquiatria. O atendimento é de responsabilidade do
            profissional habilitado.
          </p>
        </div>

        {colunas.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo} className="text-sm">
            <h2 className="eyebrow">{coluna.titulo}</h2>
            <ul className="mt-4 space-y-3">
              {coluna.links.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-page border-t border-border py-6 text-xs leading-relaxed text-muted-foreground">
        © {new Date().getFullYear()} Clarea. Esta plataforma é infraestrutura tecnológica: não
        realiza diagnósticos, não prescreve medicamentos e não promete resultados. Conteúdo
        educativo não substitui avaliação profissional.
      </div>
    </footer>
  );
}
