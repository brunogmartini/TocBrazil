import { Link } from "@tanstack/react-router";

const ITENS = [
  { to: "/profissional", rotulo: "Visão geral" },
  { to: "/profissional/agenda", rotulo: "Agenda" },
  { to: "/profissional/financeiro", rotulo: "Financeiro" },
  { to: "/profissional/cadastro", rotulo: "Atualizar meus dados" },
] as const;

/** Navegação compacta para telas menores; no desktop a barra lateral da área assume esse papel. */
export function ProfessionalNav({ ativo }: { ativo: (typeof ITENS)[number]["to"] }) {
  return (
    <nav
      aria-label="Área do profissional (compacta)"
      className="professional-nav mt-5 flex gap-2 overflow-x-auto p-2 lg:hidden"
    >
      {ITENS.map((item) =>
        item.to === ativo ? (
          <span key={item.to} className="professional-nav-active" aria-current="page">
            {item.rotulo}
          </span>
        ) : (
          <Link key={item.to} to={item.to} className="professional-nav-item">
            {item.rotulo}
          </Link>
        ),
      )}
    </nav>
  );
}

export function EtapasCadastro({
  etapaAtual,
  compacto = false,
}: {
  etapaAtual: { chave: string; titulo: string; descricao: string; indice: number };
  compacto?: boolean;
}) {
  const passos = [
    "Criar conta",
    "Preencher cadastro",
    "Enviar comprovantes",
    "Conferência documental",
    "Aceite do contrato",
    "Configurar agenda",
    "Perfil publicado",
  ];
  const problema = etapaAtual.chave === "correcao" || etapaAtual.chave === "rejeitado" || etapaAtual.chave === "suspenso";
  return (
    <ol className={`grid gap-2 ${compacto ? "grid-cols-7" : "sm:grid-cols-7"}`}>
      {passos.map((p, i) => {
        const feito = i < etapaAtual.indice;
        const atual = i === etapaAtual.indice;
        return (
          <li key={p} className="flex flex-col gap-2">
            <span
              className={`h-1.5 rounded-full ${
                feito ? "bg-professional-accent" : atual ? (problema ? "bg-destructive" : "bg-professional") : "bg-muted"
              }`}
            />
            {!compacto && (
              <span className={`text-[11px] leading-tight ${atual ? "font-semibold" : "text-muted-foreground"}`}>
                {atual ? etapaAtual.titulo : p}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
