import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/toc-brazil-logo.jpg.asset.json";

const nav = [
  { to: "/como-funciona", label: "Nossa metodologia" },
  { to: "/entenda-o-toc", label: "Sobre o transtorno" },
] as const;


const profissionais = [
  { to: "/seja-parceiro", label: "Quero ser um parceiro" },
  { to: "/profissional", label: "Área do profissional" },
] as const;


export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<null | "paciente" | "profissional">(null);
  const [logado, setLogado] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdown) return;
    function fora(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdown(null);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [dropdown]);

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

          <div className="relative flex items-center gap-1" ref={dropdownRef}>
            <button
              type="button"
              aria-expanded={dropdown === "paciente"}
              onClick={() => setDropdown((v) => (v === "paciente" ? null : "paciente"))}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sou paciente
            </button>
            <button
              type="button"
              aria-expanded={dropdown === "profissional"}
              onClick={() => setDropdown((v) => (v === "profissional" ? null : "profissional"))}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sou profissional
            </button>

            {dropdown === "paciente" && (
              <div className="absolute right-0 top-full w-60 pt-2">
                <ul className="card-soft overflow-hidden p-2">
                  {logado ? (
                    <li>
                      <Link
                        to="/painel"
                        onClick={() => setDropdown(null)}
                        className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                      >
                        Minhas consultas
                      </Link>
                    </li>
                  ) : (
                    <>
                      <li>
                        <Link
                          to="/auth"
                          search={{ modo: "cadastro" as const, redirect: undefined }}
                          onClick={() => setDropdown(null)}
                          className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                        >
                          Criar minha conta
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/auth"
                          search={{ modo: "entrar" as const, redirect: undefined }}
                          onClick={() => setDropdown(null)}
                          className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                        >
                          Entrar na minha conta
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {dropdown === "profissional" && (
              <div className="absolute right-0 top-full w-60 pt-2">
                <ul className="card-soft overflow-hidden p-2">
                  {profissionais.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setDropdown(null)}
                        className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/profissionais" className="btn-base btn-primary">
            Ver profissionais
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

            <span className="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sou paciente
            </span>
            {logado ? (
              <Link
                to="/painel"
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
              >
                Minhas consultas
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ modo: "cadastro" as const, redirect: undefined }}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
                >
                  Criar minha conta
                </Link>
                <Link
                  to="/auth"
                  search={{ modo: "entrar" as const, redirect: undefined }}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
                >
                  Entrar na minha conta
                </Link>
              </>
            )}

            <span className="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sou profissional
            </span>
            {profissionais.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
