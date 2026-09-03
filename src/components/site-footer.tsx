import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface text-surface-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-6 w-6 rounded-full bg-primary ring-4 ring-accent" />
            <span className="font-display text-lg">Acolher</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Infraestrutura tecnológica que conecta pacientes a psicólogos habilitados para
            atendimento online. O atendimento é de responsabilidade do profissional.
          </p>
        </div>

        <nav aria-label="Pacientes" className="text-sm">
          <h2 className="eyebrow">Pacientes</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link to="/psicologos" className="text-muted-foreground hover:text-foreground">
                Encontrar psicólogo
              </Link>
            </li>
            <li>
              <Link to="/toc" className="text-muted-foreground hover:text-foreground">
                Atendimento em TOC
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Profissionais" className="text-sm">
          <h2 className="eyebrow">Profissionais</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link to="/para-psicologos" className="text-muted-foreground hover:text-foreground">
                Sou psicólogo
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="eyebrow">Privacidade</h2>
          <p className="mt-4 text-muted-foreground">
            Tratamos dados pessoais conforme a LGPD, com minimização de dados e controle de
            acesso. Termos de Uso, Política de Privacidade e Política de Cookies serão
            publicados antes do lançamento.
          </p>
        </div>
      </div>
      <div className="container-page border-t border-border py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Acolher. Esta plataforma não realiza diagnósticos, não
        prescreve medicamentos e não promete resultados terapêuticos.
      </div>
    </footer>
  );
}
