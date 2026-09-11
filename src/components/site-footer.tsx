import { Link } from "@tanstack/react-router";
import logo from "@/assets/toc-brazil-logo.png";

const colunas = [
  {
    titulo: "Pacientes",
    links: [
      { to: "/profissionais", label: "Ver profissionais" },
      { to: "/como-funciona", label: "Nossa metodologia" },
      { to: "/entenda-o-toc", label: "Sobre o transtorno" },
      { to: "/painel", label: "Minhas consultas" },
    ],
  },
  {
    titulo: "Profissionais",
    links: [
      { to: "/cadastro-profissional", label: "Quero fazer parte" },
      { to: "/para-psicologos", label: "Sou psicólogo" },
      { to: "/para-psiquiatras", label: "Sou psiquiatra" },
      { to: "/profissional", label: "Área do profissional" },
      { to: "/auth", label: "Entrar" },
    ],
  },
  {
    titulo: "Institucional",
    links: [
      { to: "/entenda-o-toc", label: "Sobre o transtorno" },
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
            <img
              src={logo}
              alt="TOC Brazil — Plataforma de Apoio Especializado"
              width={1363}
              height={273}
              loading="lazy"
              className="h-14 w-auto"
            />
          </div>
          <p className="mt-4 font-display text-base">Plataforma especializada em TOC.</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Conhecimento, metodologia e profissionais selecionados em uma jornada estruturada de
            cuidado relacionado ao TOC.
          </p>
        </div>

        {colunas.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo} className="text-sm">
            <h2 className="eyebrow">{coluna.titulo}</h2>
            <ul className="mt-4 space-y-3">
              {coluna.links.map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-page border-t border-border py-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          Esta plataforma é uma infraestrutura tecnológica e não realiza diagnósticos, não prescreve
          medicamentos e não promete resultados. Conteúdo educativo não substitui avaliação
          profissional. O atendimento é de responsabilidade do profissional habilitado.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} TOC Brazil.</p>
          <Link
            to="/auth"
            search={{ modo: "entrar" as const, perfil: "gestor" as const, redirect: "/admin" }}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Acesso do gestor
          </Link>
        </div>
      </div>
    </footer>
  );
}
