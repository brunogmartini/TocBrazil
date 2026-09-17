import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exigirAreaProfissional } from "@/lib/role-access";

/**
 * Casca da área do profissional (consultório digital).
 * Garante o acesso exclusivo de profissionais e envolve todas as páginas
 * com a barra lateral verde profunda — a mesma linguagem do "Status Aprovado".
 */
export const Route = createFileRoute("/_authenticated/profissional")({
  beforeLoad: () => exigirAreaProfissional(),
  head: () => ({
    meta: [
      { title: "Área do profissional — TOC Brazil" },
      { name: "description", content: "Agenda, cadastro, recebimento direto e consultas do psicólogo na TOC Brazil." },
      { property: "og:title", content: "Área do profissional — TOC Brazil" },
      { property: "og:description", content: "Agenda, cadastro, recebimento direto e consultas do psicólogo na TOC Brazil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CascaProfissional,
});

const ITENS = [
  { to: "/profissional", rotulo: "Visão geral", icone: IconeInicio, exato: true },
  { to: "/profissional/agenda", rotulo: "Agenda", icone: IconeAgenda, exato: false },
  { to: "/profissional/financeiro", rotulo: "Financeiro", icone: IconeFinanceiro, exato: false },
  { to: "/profissional/cadastro", rotulo: "Meus dados", icone: IconeCadastro, exato: false },
] as const;

function CascaProfissional() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { modo: "entrar", perfil: "profissional", redirect: undefined }, replace: true });
  }

  return (
    <div className="professional-workspace">
      <div className="container-page py-8 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <aside className="professional-sidebar sticky top-24 hidden max-h-[calc(100vh-7rem)] flex-col self-start p-4 lg:flex">
          <div className="px-2 pb-4 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">TOC Brazil</p>
            <p className="mt-1 font-display text-lg font-semibold leading-tight">Consultório digital</p>
          </div>
          <nav aria-label="Área do profissional" className="flex flex-col gap-1">
            {ITENS.map((item) => {
              const ativo = item.exato ? pathname === item.to : pathname.startsWith(item.to);
              const Icone = item.icone;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={ativo ? "page" : undefined}
                  className={ativo ? "professional-side-active" : "professional-side-item"}
                >
                  <Icone />
                  {item.rotulo}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-professional-foreground/15 pt-4">
            <Link to="/" className="professional-side-item">
              <IconeSite />
              Ver o site
            </Link>
            <button type="button" onClick={sair} className="professional-side-item">
              <IconeSair />
              Sair
            </button>
          </div>
        </aside>

        <div className="min-w-0 [&_.container-page]:max-w-none [&_.container-page]:px-0 [&_.professional-workspace]:py-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const svg = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

function IconeInicio() {
  return (
    <svg {...svg}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconeAgenda() {
  return (
    <svg {...svg}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconeFinanceiro() {
  return (
    <svg {...svg}>
      <path d="M4 19h16M6 16V9M11 16V5M16 16v-6" />
    </svg>
  );
}
function IconeCadastro() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
function IconeSite() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function IconeSair() {
  return (
    <svg {...svg}>
      <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}
