import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/toc-brazil-logo.jpg.asset.json";

const nav = [
  { to: "/como-funciona", label: "Nossa metodologia" },
  { to: "/entenda-o-toc", label: "Sobre o transtorno" },
  { to: "/profissionais", label: "Ver profissionais" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [participar, setParticipar] = useState(false);
  const [participarMobile, setParticiparMobile] = useState(false);
  const [logado, setLogado] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!participar) return;
    function fora(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setParticipar(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [participar]);

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
          <img
            src={logoAsset.url}
            alt="TOC Brazil — Plataforma de Apoio Especializado"
            width={1251}
            height={541}
            className="h-11 w-auto rounded-sm"
          />
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
          {logado && (
            <Link
              to="/painel"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Minha área
            </Link>
          )}
        </nav>

        <div
          className="relative hidden lg:block"
          ref={dropdownRef}
          onMouseEnter={() => setParticipar(true)}
          onMouseLeave={() => setParticipar(false)}
        >
          <button
            type="button"
            aria-expanded={participar}
            aria-haspopup="true"
            onClick={() => setParticipar((v) => !v)}
            className="btn-base btn-primary"
          >
            Quero fazer parte
          </button>

          {participar && (
            <div className="absolute right-0 top-full w-60 pt-2">
              <ul className="card-soft overflow-hidden p-2">
                <li>
                  <Link
                    to="/auth"
                    search={{ modo: "cadastro" as const, redirect: undefined }}
                    onClick={() => setParticipar(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    Sou paciente
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cadastro-profissional"
                    onClick={() => setParticipar(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    Sou profissional
                  </Link>
                </li>
              </ul>
            </div>
          )}
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
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
              >
                {item.label}
              </Link>
            ))}

            {logado && (
              <Link
                to="/painel"
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
              >
                Minha área
              </Link>
            )}

            <button
              type="button"
              aria-expanded={participarMobile}
              onClick={() => setParticiparMobile((v) => !v)}
              className="btn-base btn-primary mt-3 w-full"
            >
              Quero fazer parte
            </button>
            {participarMobile && (
              <div className="mt-2 flex flex-col rounded-2xl bg-muted p-2">
                <Link
                  to="/auth"
                  search={{ modo: "cadastro" as const, redirect: undefined }}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-foreground"
                >
                  Sou paciente
                </Link>
                <Link
                  to="/cadastro-profissional"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-foreground"
                >
                  Sou profissional
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
