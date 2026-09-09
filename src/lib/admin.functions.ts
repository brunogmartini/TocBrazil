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
  cidade: string | null;
  status: string;
  valor_centavos: number;
  consultas: number;
  telefone: string | null;
  email_contato: string | null;
  graduacao: string | null;
  instituicao: string | null;
  cursos: string[];
  formacao: string[];
  especializacoes: string[];
  areas: string[];
  idiomas: string[];
  abordagem: string | null;
  apresentacao: string | null;
  experiencia_toc: string | null;
  experiencia_anos: number;
  foto_url: string | null;
  observacao_admin: string | null;
  validado_em: string | null;
  criadoEm: string;
  documentos: {
    id: string;
    tipo: string;
    nome_arquivo: string;
    status: string;
    created_at: string;
    url: string | null;
  }[];
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
        .select("*")
        .order("created_at", { ascending: false }),

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

    const idsProfissionais = (profissionais ?? []).map((p) => p.id);
    const { data: documentos } = idsProfissionais.length
      ? await supabaseAdmin
          .from("professional_documents")
          .select("id, professional_id, tipo, nome_arquivo, caminho, status, created_at")
          .in("professional_id", idsProfissionais)
          .order("created_at", { ascending: false })
      : { data: [] };

    const docsPorProfissional = new Map<string, ProfissionalAdmin["documentos"]>();
    for (const doc of documentos ?? []) {
      const { data: assinado } = await supabaseAdmin.storage
        .from("documentos-profissionais")
        .createSignedUrl(doc.caminho, 600);
      const lista = docsPorProfissional.get(doc.professional_id) ?? [];
      lista.push({
        id: doc.id,
        tipo: doc.tipo,
        nome_arquivo: doc.nome_arquivo,
        status: doc.status as string,
        created_at: doc.created_at,
        url: assinado?.signedUrl ?? null,
      });
      docsPorProfissional.set(doc.professional_id, lista);
    }

    const listaProfissionais: ProfissionalAdmin[] = (profissionais ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      profissao: p.profissao as string,
      registro: p.registro,
      uf: p.uf,
      cidade: p.cidade,
      status: p.status as string,
      valor_centavos: p.valor_centavos,
      consultas: consultasPorProfissional.get(p.nome) ?? 0,
      telefone: p.telefone,
      email_contato: p.email_contato,
      graduacao: p.graduacao,
      instituicao: p.instituicao,
      cursos: p.cursos ?? [],
      formacao: p.formacao ?? [],
      especializacoes: p.especializacoes ?? [],
      areas: p.areas ?? [],
      idiomas: p.idiomas ?? [],
      abordagem: p.abordagem,
      apresentacao: p.apresentacao,
      experiencia_toc: p.experiencia_toc,
      experiencia_anos: p.experiencia_anos,
      foto_url: p.foto_url,
      observacao_admin: p.observacao_admin,
      validado_em: p.validado_em,
      criadoEm: p.created_at,
      documentos: docsPorProfissional.get(p.id) ?? [],
    }));

    const totais = {
      usuarios: usuarios.length,
      profissionais: listaProfissionais.length,
      pendentes: listaProfissionais.filter((p) => p.status === "pendente").length,
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
  .inputValidator(
    (data: {
      id: string;
      status: "pendente" | "aprovado" | "suspenso" | "rejeitado";
      observacao?: string;
    }) => ({
      id: String(data.id),
      status: data.status,
      observacao: data.observacao ? String(data.observacao).trim().slice(0, 1000) : null,
    }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("professionals")
      .update({
        status: data.status,
        observacao_admin: data.observacao,
        validado_em: new Date().toISOString(),
        validado_por: context.userId,
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar." };
    return { ok: true as const };
  });

export const definirStatusDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id: string; status: "enviado" | "aprovado" | "recusado"; observacao?: string }) => ({
      id: String(data.id),
      status: data.status,
      observacao: data.observacao ? String(data.observacao).trim().slice(0, 500) : null,
    }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("professional_documents")
      .update({ status: data.status, observacao_admin: data.observacao })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar o documento." };
    return { ok: true as const };
  });

export const editarProfissionalAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id: string;
      nome?: string;
      graduacao?: string;
      instituicao?: string;
      abordagem?: string;
      apresentacao?: string;
      experiencia_toc?: string;
      experiencia_anos?: number;
      formacao?: string;
      especializacoes?: string;
      cursos?: string;
      areas?: string;
      idiomas?: string;
      foto_url?: string;
      voltarParaAnalise?: boolean;
    }) => {
      const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max) || null;
      const lista = (v: unknown) =>
        String(v ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 30);
      return {
        id: String(data.id),
        nome: texto(data.nome, 120),
        graduacao: texto(data.graduacao, 160),
        instituicao: texto(data.instituicao, 160),
        abordagem: texto(data.abordagem, 160),
        apresentacao: texto(data.apresentacao, 2000),
        experiencia_toc: texto(data.experiencia_toc, 2000),
        experiencia_anos: Math.min(Math.max(Number(data.experiencia_anos ?? 0) || 0, 0), 70),
        formacao: lista(data.formacao),
        especializacoes: lista(data.especializacoes),
        cursos: lista(data.cursos),
        areas: lista(data.areas),
        idiomas: lista(data.idiomas),
        foto_url: texto(data.foto_url, 500),
        voltarParaAnalise: Boolean(data.voltarParaAnalise),
      };
    },
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, voltarParaAnalise, nome, ...resto } = data;
    const { error } = await supabaseAdmin
      .from("professionals")
      .update({
        ...resto,
        ...(nome ? { nome } : {}),
        ...(voltarParaAnalise ? { status: "pendente" as const } : {}),
      })
      .eq("id", id);
    if (error) return { ok: false as const, erro: "Não foi possível salvar as alterações." };
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
      .update(
        data.status === "aprovado"
          ? { payment_status: data.status, status: "confirmada" as const }
          : { payment_status: data.status },
      )
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar." };
    return { ok: true as const };
  });
