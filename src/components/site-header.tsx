import { Link } from "@tanstack/react-router";
import { useState } from "react";

const nav = [
  { to: "/psicologos", label: "Encontrar psicólogo" },
  { to: "/toc", label: "Atendimento em TOC" },
  { to: "/para-psicologos", label: "Sou psicólogo" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Página inicial">
          <span
            aria-hidden="true"
            className="h-7 w-7 rounded-full bg-primary ring-4 ring-accent"
          />
          <span className="font-display text-lg tracking-tight">Acolher</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
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
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/psicologos" className="btn-base btn-primary">
            Encontrar meu psicólogo
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Abrir menu"
          className="btn-base btn-ghost px-4 py-2 md:hidden"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
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
            <Link
              to="/psicologos"
              onClick={() => setOpen(false)}
              className="btn-base btn-primary mt-2"
            >
              Encontrar meu psicólogo
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
