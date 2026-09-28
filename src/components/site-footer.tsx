import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/toc-brazil-logo.png.asset.json";
import { institucional } from "@/config/institucional";

const colunas = [
  {
    titulo: "Pacientes",
    links: [
      { to: "/profissionais", label: "Ver profissionais" },
      { to: "/como-funciona", label: "Como funciona" },
      { to: "/entenda-o-toc", label: "Sobre o transtorno" },
      { to: "/painel", label: "Minhas consultas" },
    ],
  },
  {
    titulo: "Profissionais",
    links: [
      { to: "/cadastro-profissional", label: "Sou psicólogo" },
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
              src={logoAsset.url}
              alt="TOC Brazil — Plataforma de Apoio Especializado"
              width={1291}
              height={554}
              loading="lazy"
              className="h-[3.25rem] w-auto"
            />
          </div>
          <p className="mt-4 font-display text-base">Plataforma especializada em TOC.</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Busca, agendamento e pagamento para consultas com psicólogos cadastrados na plataforma.
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

      <div className="container-page border-t border-border pb-16 pt-6 text-xs leading-relaxed text-muted-foreground lg:pb-14">
        <address className="mb-5 border-b border-border pb-5 text-sm not-italic text-foreground">
          <p className="font-semibold text-foreground">
            {institucional.razaoSocial} — CNPJ {institucional.cnpj}
          </p>
          <a className="mt-1 inline-block underline underline-offset-4" href={`mailto:${institucional.email}`}>
            {institucional.email}
          </a>
        </address>
        <p>
          Esta plataforma é uma infraestrutura tecnológica e não presta serviço de saúde. Conteúdo educativo não substitui consulta com profissional habilitado. A consulta acontece na sala do próprio psicólogo.
        </p>
        <p className="mt-2">© {new Date().getFullYear()} TOC Brazil.</p>
      </div>
    </footer>
  );
}
