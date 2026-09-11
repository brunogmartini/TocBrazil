import { redirect } from "@tanstack/react-router";
import { meusPapeis } from "@/lib/plataforma.functions";
import { INICIO_DA_AREA, type Area } from "@/lib/areas";

export const CHAVE_PERFIL_PRETENDIDO = "toc-perfil-pretendido";

function perfilPretendidoGuardado(): "profissional" | undefined {
  if (typeof window === "undefined") return undefined;
  const valor = window.sessionStorage.getItem(CHAVE_PERFIL_PRETENDIDO);
  return valor === "profissional" ? "profissional" : undefined;
}

export function guardarPerfilPretendido(perfil: "paciente" | "profissional" | "gestor") {
  if (typeof window === "undefined") return;
  if (perfil === "profissional") window.sessionStorage.setItem(CHAVE_PERFIL_PRETENDIDO, perfil);
  else window.sessionStorage.removeItem(CHAVE_PERFIL_PRETENDIDO);
}

/**
 * Descobre (e, na primeira vez, fixa) a área da conta autenticada.
 * A resposta vem do servidor com base nos papéis reais em `user_roles`.
 */
export async function minhaArea(perfilPretendido?: "profissional"): Promise<Area> {
  const perfil = perfilPretendido ?? perfilPretendidoGuardado();
  const resultado = await meusPapeis({ data: perfil ? { perfil } : {} });
  if (typeof window !== "undefined") window.sessionStorage.removeItem(CHAVE_PERFIL_PRETENDIDO);
  return resultado.area;
}

/** Bloqueia a rota se a conta não pertencer à área exigida, levando-a para a área correta. */
export async function exigirArea(area: Area) {
  const atual = await minhaArea();
  if (atual !== area) throw redirect({ to: INICIO_DA_AREA[atual], replace: true });
  return atual;
}

export const exigirAreaPaciente = () => exigirArea("paciente");
export const exigirAreaProfissional = () => exigirArea("profissional");
export const exigirAreaGestor = () => exigirArea("gestor");

export async function destinoDaMinhaArea() {
  return INICIO_DA_AREA[await minhaArea()];
}
