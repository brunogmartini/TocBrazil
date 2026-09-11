import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Papel = "paciente" | "profissional" | "admin";

async function papeisDoUsuario(userId: string): Promise<Papel[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((item) => item.role as Papel);
}

export async function exigirAreaPaciente(userId: string) {
  const papeis = await papeisDoUsuario(userId);
  if (papeis.includes("admin")) throw redirect({ to: "/admin" });
  if (papeis.includes("profissional")) throw redirect({ to: "/profissional" });
}

export async function exigirAreaProfissional(userId: string, permitirSemPapel = false) {
  const papeis = await papeisDoUsuario(userId);
  if (papeis.includes("admin")) throw redirect({ to: "/admin" });
  if (!papeis.includes("profissional") && !(permitirSemPapel && papeis.length === 0)) {
    throw redirect({ to: "/painel" });
  }
}

export async function destinoDaMinhaArea(userId: string) {
  const papeis = await papeisDoUsuario(userId);
  if (papeis.includes("admin")) return "/admin" as const;
  if (papeis.includes("profissional")) return "/profissional" as const;
  return "/painel" as const;
}