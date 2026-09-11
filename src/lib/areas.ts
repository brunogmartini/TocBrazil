/**
 * Regras puras (sem I/O) para decidir a área de cada conta.
 * Compartilhado entre o servidor (server functions) e o navegador (guards de rota).
 */
export type Papel = "paciente" | "profissional" | "admin";
export type Area = "paciente" | "profissional" | "gestor";

export const INICIO_DA_AREA = {
  paciente: "/painel",
  profissional: "/profissional",
  gestor: "/admin",
} as const;

export const ROTULO_DA_AREA: Record<Area, string> = {
  paciente: "paciente",
  profissional: "profissional",
  gestor: "gestor",
};

/** Precedência: gestor > profissional > paciente. Uma conta pertence a uma única área. */
export function areaDosPapeis(papeis: readonly string[]): Area {
  if (papeis.includes("admin")) return "gestor";
  if (papeis.includes("profissional")) return "profissional";
  return "paciente";
}

/** A qual área um caminho interno pertence (null = página pública). */
export function areaDoCaminho(caminho: string | undefined | null): Area | null {
  if (!caminho) return null;
  const p = caminho.split(/[?#]/)[0] ?? "";
  if (p === "/admin" || p.startsWith("/admin/")) return "gestor";
  if (p === "/profissional" || p.startsWith("/profissional/")) return "profissional";
  if (p === "/painel" || p.startsWith("/painel/") || p.startsWith("/agendar/")) return "paciente";
  return null;
}

/**
 * Destino final após o login: respeita o `redirect` só quando ele pertence
 * à área real da conta; caso contrário, vai para o início da área.
 */
export function destinoDaArea(area: Area, redirect?: string | null) {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    const areaDoRedirect = areaDoCaminho(redirect);
    if (areaDoRedirect === null || areaDoRedirect === area) return redirect;
  }
  return INICIO_DA_AREA[area];
}
