import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UsuarioAdmin = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  criadoEm: string;
  papeis: string[];
  consultas: number;
  pagoCentavos: number;
};

export type ConsultaAdmin = {
  id: string;
  inicio: string;
  status: string;
  payment_status: string;
  valor_centavos: number;
  paciente: string;
  profissional: string;
  video_url: string | null;
};

export type ProfissionalAdmin = {
  id: string;
  nome: string;
  slug: string;
  profissao: string;
  registro: string;
  uf: string;
  status: string;
  valor_centavos: number;
  consultas: number;
};

async function garantirAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso restrito ao administrador.");
}

export const painelAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { data: perfis },
      { data: papeis },
      { data: consultas },
      { data: profissionais },
      { data: pagamentos },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, nome, email, telefone, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("appointments")
        .select(
          "id, inicio, status, payment_status, valor_centavos, patient_id, video_url, professionals(nome)",
        )
        .order("inicio", { ascending: false })
        .limit(300),
      supabaseAdmin
        .from("professionals")
        .select("id, nome, slug, profissao, registro, uf, status, valor_centavos"),
      supabaseAdmin.from("payments").select("id, patient_id, status, valor_centavos, created_at"),
    ]);

    const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.nome ?? p.email ?? "—"]));
    const papeisPorId = new Map<string, string[]>();
    for (const p of papeis ?? []) {
      papeisPorId.set(p.user_id, [...(papeisPorId.get(p.user_id) ?? []), p.role as string]);
    }

    const consultasPorPaciente = new Map<string, number>();
    const pagoPorPaciente = new Map<string, number>();
    for (const c of consultas ?? []) {
      consultasPorPaciente.set(c.patient_id, (consultasPorPaciente.get(c.patient_id) ?? 0) + 1);
      if (c.payment_status === "aprovado") {
        pagoPorPaciente.set(
          c.patient_id,
          (pagoPorPaciente.get(c.patient_id) ?? 0) + (c.valor_centavos ?? 0),
        );
      }
    }
    const consultasPorProfissional = new Map<string, number>();
    for (const c of consultas ?? []) {
      const nome = (c.professionals as { nome?: string } | null)?.nome ?? "";
      consultasPorProfissional.set(nome, (consultasPorProfissional.get(nome) ?? 0) + 1);
    }

    const usuarios: UsuarioAdmin[] = (perfis ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      criadoEm: p.created_at,
      papeis: papeisPorId.get(p.id) ?? ["paciente"],
      consultas: consultasPorPaciente.get(p.id) ?? 0,
      pagoCentavos: pagoPorPaciente.get(p.id) ?? 0,
    }));

    const listaConsultas: ConsultaAdmin[] = (consultas ?? []).map((c) => ({
      id: c.id,
      inicio: c.inicio,
      status: c.status as string,
      payment_status: c.payment_status as string,
      valor_centavos: c.valor_centavos,
      paciente: nomePorId.get(c.patient_id) ?? "—",
      profissional: (c.professionals as { nome?: string } | null)?.nome ?? "—",
      video_url: c.video_url,
    }));

    const listaProfissionais: ProfissionalAdmin[] = (profissionais ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      profissao: p.profissao as string,
      registro: p.registro,
      uf: p.uf,
      status: p.status as string,
      valor_centavos: p.valor_centavos,
      consultas: consultasPorProfissional.get(p.nome) ?? 0,
    }));

    const totais = {
      usuarios: usuarios.length,
      profissionais: listaProfissionais.length,
      consultas: listaConsultas.length,
      aguardandoPagamento: listaConsultas.filter((c) => c.payment_status === "pendente").length,
      recebidoCentavos: listaConsultas
        .filter((c) => c.payment_status === "aprovado")
        .reduce((s, c) => s + c.valor_centavos, 0),
      pagamentos: (pagamentos ?? []).length,
    };

    return { usuarios, consultas: listaConsultas, profissionais: listaProfissionais, totais };
  });

export const definirStatusProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "pendente" | "aprovado" | "suspenso" }) => ({
    id: String(data.id),
    status: data.status,
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("professionals")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar." };
    return { ok: true as const };
  });

export const definirStatusPagamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id: string; status: "pendente" | "aprovado" | "recusado" | "estornado" }) => ({
      id: String(data.id),
      status: data.status,
    }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({
        payment_status: data.status,
        status: data.status === "aprovado" ? "confirmada" : undefined,
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar." };
    return { ok: true as const };
  });
