import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/toc-brazil-logo.png.asset.json";
import { INICIO_DA_AREA } from "@/lib/areas";
import { CHAVE_PERFIL_PRETENDIDO, minhaArea } from "@/lib/role-access";

const nav = [
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/entenda-o-toc", label: "Sobre o transtorno" },
  { to: "/profissionais", label: "Ver profissionais" },
] as const;

type Inicio = (typeof INICIO_DA_AREA)[keyof typeof INICIO_DA_AREA];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [minhaAreaTo, setMinhaAreaTo] = useState<Inicio | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let ativo = true;
    // "Minha área" aponta para a área real da conta (paciente, profissional ou gestor).
    async function resolver(evento?: string) {
      const intencaoPendente = !!window.sessionStorage.getItem(CHAVE_PERFIL_PRETENDIDO);
      const area = await minhaArea().catch(() => null);
      if (!ativo) return;
      setMinhaAreaTo(area ? INICIO_DA_AREA[area] : "/painel");
      // Login social recém-concluído a partir de um botão de acesso: leva direto para a área.
      if (evento === "SIGNED_IN" && intencaoPendente && area) {
        navigate({ to: INICIO_DA_AREA[area] });
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void resolver();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setMinhaAreaTo(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void resolver(event);
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const logado = minhaAreaTo !== null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="TOC Brazil — página inicial">
          <img
            src={logoAsset.url}
            alt="TOC Brazil — Plataforma de Apoio Especializado"
            width={1291}
            height={554}
            className="h-14 w-auto"
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
              to={minhaAreaTo ?? "/painel"}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Minha área
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/cadastro-profissional" className="btn-base btn-ghost">Sou psicólogo</Link>
          <Link to="/auth" search={{ modo: "entrar" as const, redirect: undefined }} className="btn-base btn-primary">Entrar</Link>
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
                to={minhaAreaTo ?? "/painel"}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-sm font-medium text-foreground"
              >
                Minha área
              </Link>
            )}

            <Link to="/cadastro-profissional" onClick={() => setOpen(false)} className="rounded-xl px-2 py-3 text-sm font-medium text-foreground">Sou psicólogo</Link>
            <Link to="/auth" search={{ modo: "entrar" as const, redirect: undefined }} onClick={() => setOpen(false)} className="btn-base btn-primary mt-3 w-full">Entrar</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
