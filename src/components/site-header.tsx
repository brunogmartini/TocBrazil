import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/entenda-o-toc", label: "Entenda o TOC" },
  { to: "/profissionais", label: "Encontrar um especialista em TOC" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/conteudos", label: "Conteúdos" },
] as const;

const profissionais = [
  { to: "/seja-parceiro", label: "Quero ser um profissional parceiro" },
  { to: "/para-psicologos", label: "Sou psicólogo" },
  { to: "/para-psiquiatras", label: "Sou psiquiatra" },
  { to: "/cadastro-profissional", label: "Cadastro profissional" },
  { to: "/profissional", label: "Área do profissional" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLogado(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="TOC Brazil — página inicial">
          <span aria-hidden="true" className="logo-mark" />
          <span className="font-display text-lg tracking-tight">TOC Brazil</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {item.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setDropdown(true)}
            onMouseLeave={() => setDropdown(false)}
          >
            <button
              type="button"
              aria-expanded={dropdown}
              onClick={() => setDropdown((v) => !v)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sou profissional
            </button>
            {dropdown && (
              <div className="absolute right-0 top-full w-60 pt-2">
                <ul className="card-soft overflow-hidden p-2">
                  {profissionais.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setDropdown(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      to={logado ? "/painel" : "/auth"}
                      onClick={() => setDropdown(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                      {logado ? "Minha área" : "Entrar"}
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to={logado ? "/painel" : "/auth"}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {logado ? "Minha área" : "Entrar"}
          </Link>
          <Link to="/profissionais" className="btn-base btn-primary">
            Encontrar um especialista em TOC
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir menu de navegação"
          className="btn-base btn-ghost px-4 py-2 lg:hidden"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <nav aria-label="Principal (mobile)" className="container-page flex flex-col py-3">
            {[...nav, ...profissionais].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={logado ? "/painel" : "/auth"}
              onClick={() => setOpen(false)}
              className="rounded-xl px-2 py-3 text-sm font-medium text-muted-foreground"
            >
              {logado ? "Minha área" : "Entrar"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
