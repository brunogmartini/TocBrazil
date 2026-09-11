import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugificar(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function lista(valor: unknown) {
  if (Array.isArray(valor)) return valor.map((v) => String(v).trim()).filter(Boolean).slice(0, 20);
  return String(valor ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export type CadastroProfissionalEntrada = {
  nome: string;
  profissao: "psicologo" | "psiquiatra";
  registro: string;
  uf: string;
  cidade?: string;
  telefone?: string;
  email_contato?: string;
  genero?: string;
  abordagem?: string;
  destaque?: string;
  apresentacao?: string;
  experiencia_toc?: string;
  experiencia_anos?: number;
  slot_minutos?: number;
  valor_centavos?: number;
  graduacao?: string;
  instituicao?: string;
  cursos?: string[] | string;
  formacao?: string[] | string;
  especializacoes?: string[] | string;
  areas?: string[] | string;

  idiomas?: string[] | string;
};

export const meuCadastroProfissional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data: profissional } = await supabase
      .from("professionals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profissional) {
      return {
        profissional: null,
        documentos: [],
        regras: [],
        bloqueios: [],
        repasse: null,
        email: (claims as { email?: string }).email ?? null,
      };
    }

    const [{ data: documentos }, { data: regras }, { data: bloqueios }, { data: repasse }] =
      await Promise.all([
        supabase
          .from("professional_documents")
          .select("id, tipo, nome_arquivo, caminho, status, observacao_admin, created_at")
          .eq("professional_id", profissional.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("availability_rules")
          .select("id, weekday, hora_inicio, hora_fim")
          .eq("professional_id", profissional.id)
          .order("weekday"),
        supabase
          .from("availability_blocks")
          .select("id, inicio, fim, motivo")
          .eq("professional_id", profissional.id)
          .gte("fim", new Date().toISOString())
          .order("inicio"),
        supabase
          .from("professional_payout_details")
          .select("*")
          .eq("professional_id", profissional.id)
          .maybeSingle(),
      ]);

    return {
      profissional,
      documentos: documentos ?? [],
      regras: regras ?? [],
      bloqueios: bloqueios ?? [],
      repasse: repasse ?? null,
      email: (claims as { email?: string }).email ?? null,
    };
  });

export const salvarCadastroProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CadastroProfissionalEntrada) => {
    const nome = String(data.nome ?? "").trim().slice(0, 120);
    if (nome.length < 3) throw new Error("Informe seu nome completo.");
    const registro = String(data.registro ?? "").trim().slice(0, 40);
    if (registro.length < 3) throw new Error("Informe seu registro profissional (CRP ou CRM).");
    const uf = String(data.uf ?? "").trim().toUpperCase().slice(0, 2);
    if (uf.length !== 2) throw new Error("Informe a UF do registro.");
    const profissao: "psicologo" | "psiquiatra" =
      data.profissao === "psiquiatra" ? "psiquiatra" : "psicologo";
    return {
      nome,
      registro,
      uf,
      profissao,
      cidade: String(data.cidade ?? "").trim().slice(0, 80) || null,
      telefone: String(data.telefone ?? "").trim().slice(0, 30) || null,
      email_contato: String(data.email_contato ?? "").trim().slice(0, 160) || null,
      genero: String(data.genero ?? "").trim().slice(0, 30) || null,
      abordagem: String(data.abordagem ?? "").trim().slice(0, 160) || null,
      destaque: String(data.destaque ?? "").trim().slice(0, 200) || null,
      apresentacao: String(data.apresentacao ?? "").trim().slice(0, 2000) || null,
      experiencia_toc: String(data.experiencia_toc ?? "").trim().slice(0, 2000) || null,
      experiencia_anos: Math.min(Math.max(Number(data.experiencia_anos ?? 0) || 0, 0), 70),
      slot_minutos: [30, 40, 50, 60].includes(Number(data.slot_minutos))
        ? Number(data.slot_minutos)
        : 50,
      valor_centavos: Math.min(
        Math.max(Math.round(Number(data.valor_centavos ?? 0) || 0), 0),
        500000,
      ),
      graduacao: String(data.graduacao ?? "").trim().slice(0, 160) || null,
      instituicao: String(data.instituicao ?? "").trim().slice(0, 160) || null,
      cursos: lista(data.cursos),
      formacao: lista(data.formacao),
      especializacoes: lista(data.especializacoes),

      areas: lista(data.areas),
      idiomas: lista(data.idiomas),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existente } = await supabase
      .from("professionals")
      .select("id, slug, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (existente) {
      const { error } = await supabase.from("professionals").update(data).eq("id", existente.id);
      if (error) return { ok: false as const, erro: "Não foi possível salvar seus dados agora." };
      return { ok: true as const, id: existente.id, slug: existente.slug };
    }

    let slug = slugificar(data.nome) || `profissional-${userId.slice(0, 6)}`;
    const { data: conflito } = await supabase
      .from("professionals")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (conflito) slug = `${slug}-${userId.slice(0, 4)}`;

    const { data: criado, error } = await supabase
      .from("professionals")
      .insert({ ...data, slug, user_id: userId, status: "pendente" })
      .select("id, slug")
      .single();
    if (error) return { ok: false as const, erro: "Não foi possível criar seu cadastro agora." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "profissional" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    return { ok: true as const, id: criado.id, slug: criado.slug };
  });

export const salvarDadosRepasse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      banco?: string;
      agencia?: string;
      conta?: string;
      tipo_conta?: string;
      chave_pix?: string;
      documento?: string;
    }) => ({
      banco: String(data.banco ?? "").trim().slice(0, 80) || null,
      agencia: String(data.agencia ?? "").trim().slice(0, 20) || null,
      conta: String(data.conta ?? "").trim().slice(0, 30) || null,
      tipo_conta: String(data.tipo_conta ?? "").trim().slice(0, 20) || null,
      chave_pix: String(data.chave_pix ?? "").trim().slice(0, 120) || null,
      documento: String(data.documento ?? "").trim().slice(0, 30) || null,
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { ok: false as const, erro: "Complete seu cadastro primeiro." };
    const { error } = await supabase
      .from("professional_payout_details")
      .upsert({ professional_id: prof.id, ...data }, { onConflict: "professional_id" });
    if (error) return { ok: false as const, erro: "Não foi possível salvar os dados de repasse." };
    return { ok: true as const };
  });

export const salvarDisponibilidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { regras: { weekday: number; hora_inicio: string; hora_fim: string }[] }) => ({
    regras: (data.regras ?? [])
      .map((r) => ({
        weekday: Math.min(Math.max(Number(r.weekday), 0), 6),
        hora_inicio: String(r.hora_inicio).slice(0, 5),
        hora_fim: String(r.hora_fim).slice(0, 5),
      }))
      .filter((r) => r.hora_inicio < r.hora_fim)
      .slice(0, 21),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { ok: false as const, erro: "Complete seu cadastro primeiro." };

    await supabase.from("availability_rules").delete().eq("professional_id", prof.id);
    if (data.regras.length) {
      const { error } = await supabase
        .from("availability_rules")
        .insert(data.regras.map((r) => ({ ...r, professional_id: prof.id })));
      if (error) return { ok: false as const, erro: "Não foi possível salvar sua agenda." };
    }
    return { ok: true as const };
  });

export const criarBloqueio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { inicio: string; fim: string; motivo?: string }) => ({
    inicio: String(data.inicio),
    fim: String(data.fim),
    motivo: String(data.motivo ?? "").trim().slice(0, 120) || null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const inicio = new Date(data.inicio);
    const fim = new Date(data.fim);
    if (!(inicio < fim)) return { ok: false as const, erro: "O fim precisa ser depois do início." };
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { ok: false as const, erro: "Complete seu cadastro primeiro." };
    const { error } = await supabase.from("availability_blocks").insert({
      professional_id: prof.id,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      motivo: data.motivo,
    });
    if (error) return { ok: false as const, erro: "Não foi possível bloquear esse período." };
    return { ok: true as const };
  });

export const removerBloqueio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("availability_blocks")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível remover o bloqueio." };
    return { ok: true as const };
  });

export const registrarDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { tipo: string; nome_arquivo: string; caminho: string }) => ({
    tipo: String(data.tipo).trim().slice(0, 60),
    nome_arquivo: String(data.nome_arquivo).trim().slice(0, 200),
    caminho: String(data.caminho).trim().slice(0, 300),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.caminho.startsWith(`${userId}/`)) {
      return { ok: false as const, erro: "Arquivo inválido." };
    }
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { ok: false as const, erro: "Complete seu cadastro primeiro." };
    const { error } = await supabase
      .from("professional_documents")
      .insert({ professional_id: prof.id, ...data });
    if (error) return { ok: false as const, erro: "Não foi possível registrar o documento." };
    return { ok: true as const };
  });

export const removerDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: doc } = await supabase
      .from("professional_documents")
      .select("id, caminho")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) return { ok: false as const, erro: "Documento não encontrado." };
    await supabase.storage.from("documentos-profissionais").remove([doc.caminho]);
    const { error } = await supabase.from("professional_documents").delete().eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível remover o documento." };
    return { ok: true as const };
  });

/* ---------- etapas do cadastro ---------- */

export type EtapaCadastro = {
  chave:
    | "iniciado"
    | "dados"
    | "documentos"
    | "analise"
    | "correcao"
    | "aprovado"
    | "publicado"
    | "rejeitado"
    | "suspenso";
  titulo: string;
  descricao: string;
  indice: number;
};

export const ETAPAS_CADASTRO: { chave: EtapaCadastro["chave"]; titulo: string }[] = [
  { chave: "iniciado", titulo: "Cadastro iniciado" },
  { chave: "dados", titulo: "Dados pessoais preenchidos" },
  { chave: "documentos", titulo: "Documentação enviada" },
  { chave: "analise", titulo: "Documentação em análise" },
  { chave: "correcao", titulo: "Necessita correção" },
  { chave: "aprovado", titulo: "Cadastro aprovado" },
  { chave: "publicado", titulo: "Perfil publicado" },
];

export function calcularEtapa(
  prof: {
    status: string;
    requer_correcao?: boolean | null;
    graduacao?: string | null;
    apresentacao?: string | null;
    areas?: string[] | null;
    valor_centavos?: number | null;
  } | null,
  documentos: { status: string }[],
  temAgenda: boolean,
): EtapaCadastro {
  if (!prof) {
    return { chave: "iniciado", titulo: "Cadastro iniciado", descricao: "Preencha seus dados profissionais.", indice: 0 };
  }
  if (prof.status === "rejeitado") {
    return { chave: "rejeitado", titulo: "Cadastro não aprovado", descricao: "Veja a observação da análise.", indice: 4 };
  }
  if (prof.status === "suspenso") {
    return { chave: "suspenso", titulo: "Perfil suspenso", descricao: "Entre em contato com o suporte.", indice: 5 };
  }
  if (prof.status === "aprovado") {
    return temAgenda
      ? { chave: "publicado", titulo: "Perfil publicado", descricao: "Seu perfil está visível e recebe agendamentos.", indice: 6 }
      : { chave: "aprovado", titulo: "Cadastro aprovado", descricao: "Defina sua disponibilidade para receber agendamentos.", indice: 5 };
  }
  if (prof.requer_correcao) {
    return { chave: "correcao", titulo: "Necessita correção", descricao: "Ajuste o que foi pedido e reenvie.", indice: 4 };
  }
  const dadosOk = Boolean(prof.graduacao && prof.apresentacao && (prof.areas ?? []).length > 0);
  if (!dadosOk) {
    return { chave: "dados", titulo: "Dados pessoais em preenchimento", descricao: "Complete formação, apresentação e áreas.", indice: 1 };
  }
  if (documentos.length === 0) {
    return { chave: "documentos", titulo: "Aguardando documentos", descricao: "Envie identidade, registro e diplomas.", indice: 2 };
  }
  return { chave: "analise", titulo: "Documentação em análise", descricao: "Nossa equipe está verificando seus documentos.", indice: 3 };
}

/* ---------- agenda visual ---------- */

export type ConsultaAgenda = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  payment_status: string;
  duracao_minutos: number;
  valor_consulta_centavos: number;
  taxa_agendamento_centavos: number;
  valor_profissional_centavos: number;
  valor_plataforma_centavos: number;
  video_url: string | null;
  patient_id: string;
  paciente: string;
  codigo: string | null;
  vinculado: boolean;
};

function rotuloPaciente(
  perfil: { nome: string | null; codigo_anonimo: string | null } | undefined,
  patientId: string,
) {
  if (!perfil) return { paciente: `Paciente ${patientId.slice(0, 4).toUpperCase()}`, codigo: null, vinculado: false };
  const primeiro = (perfil.nome ?? "").trim().split(/\s+/)[0] || "Paciente";
  const sobrenome = (perfil.nome ?? "").trim().split(/\s+/).slice(1).pop();
  const rotulo = sobrenome ? `${primeiro} ${sobrenome[0]!.toUpperCase()}.` : primeiro;
  return { paciente: rotulo, codigo: perfil.codigo_anonimo, vinculado: true };
}

async function profissionalDoUsuario(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >;
  const { data } = await supabase
    .from("professionals")
    .select("id, nome, slug, status, slot_minutos, comissao_percent, valor_centavos, requer_correcao, observacao_admin, graduacao, apresentacao, areas")
    .eq("user_id", context.userId)
    .maybeSingle();
  return { supabase, prof: data };
}

export const minhaAgendaProfissional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { de?: string; ate?: string }) => ({
    de: data?.de ? String(data.de) : null,
    ate: data?.ate ? String(data.ate) : null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { profissional: null, consultas: [] as ConsultaAgenda[], regras: [], bloqueios: [], documentos: [], etapa: calcularEtapa(null, [], false) };

    const { concluirConsultasVencidas } = await import("@/lib/plataforma.functions");
    await concluirConsultasVencidas();

    const agora = new Date();
    const de = data.de ? new Date(data.de) : new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const ate = data.ate ? new Date(data.ate) : new Date(agora.getFullYear(), agora.getMonth() + 2, 1);

    const [{ data: consultas }, { data: regras }, { data: bloqueios }, { data: documentos }] =
      await Promise.all([
        supabase
          .from("appointments")
          .select(
            "id, inicio, fim, status, payment_status, duracao_minutos, valor_consulta_centavos, taxa_agendamento_centavos, valor_profissional_centavos, valor_plataforma_centavos, video_url, patient_id",
          )
          .eq("professional_id", prof.id)
          .gte("inicio", de.toISOString())
          .lt("inicio", ate.toISOString())
          .order("inicio"),
        supabase
          .from("availability_rules")
          .select("id, weekday, hora_inicio, hora_fim")
          .eq("professional_id", prof.id)
          .order("weekday"),
        supabase
          .from("availability_blocks")
          .select("id, inicio, fim, motivo")
          .eq("professional_id", prof.id)
          .gte("fim", de.toISOString())
          .lt("inicio", ate.toISOString())
          .order("inicio"),
        supabase
          .from("professional_documents")
          .select("id, status")
          .eq("professional_id", prof.id),
      ]);

    const ids = [...new Set((consultas ?? []).map((c) => c.patient_id))];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfis } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, nome, codigo_anonimo").in("id", ids)
      : { data: [] as { id: string; nome: string | null; codigo_anonimo: string | null }[] };
    const perfilPorId = new Map(
      (perfis ?? []).map((p) => [p.id, { ...p, nome: p.nome?.trim().split(/\s+/)[0] ?? null }]),
    );

    const lista: ConsultaAgenda[] = (consultas ?? []).map((c) => ({
      ...c,
      ...rotuloPaciente(perfilPorId.get(c.patient_id), c.patient_id),
    }));

    return {
      profissional: prof,
      consultas: lista,
      regras: regras ?? [],
      bloqueios: bloqueios ?? [],
      documentos: documentos ?? [],
      etapa: calcularEtapa(prof, documentos ?? [], (regras ?? []).length > 0),
    };
  });

export const marcarConsultaRealizada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "realizada" | "nao_compareceu" | "cancelada" }) => ({
    id: String(data.id),
    status: data.status,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { ok: false as const, erro: "Acesso exclusivo para profissionais." };
    const extra =
      data.status === "cancelada"
        ? { cancelada_em: new Date().toISOString(), cancelada_por: "profissional" }
        : {};
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", data.id)
      .eq("professional_id", prof.id)
      .maybeSingle();
    if (!consulta) return { ok: false as const, erro: "Consulta não encontrada." };
    const { error } = await supabase
      .from("appointments")
      .update({ status: data.status, ...extra })
      .eq("id", data.id)
      .eq("professional_id", prof.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar a consulta." };
    return { ok: true as const };
  });

/* ---------- ficha sigilosa e anotações ---------- */

export const fichaPaciente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { patientId: string }) => ({ patientId: String(data.patientId) }))
  .handler(async ({ data, context }) => {
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { ok: false as const, erro: "Cadastro profissional não encontrado." };

    const { data: vinculo } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", data.patientId)
      .eq("professional_id", prof.id)
      .in("status", ["confirmada", "realizada", "nao_compareceu", "remarcada"])
      .limit(1)
      .maybeSingle();
    if (!vinculo) {
      return { ok: false as const, erro: "Você só pode acessar pacientes vinculados ao seu atendimento." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: perfil }, { data: ficha }, { data: consultas }, { data: anotacoes }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, nome, data_nascimento, codigo_anonimo, created_at")
          .eq("id", data.patientId)
          .maybeSingle(),
        supabase
          .from("patient_clinical_records")
          .select("*")
          .eq("patient_id", data.patientId)
          .eq("professional_id", prof.id)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("id, inicio, fim, status, duracao_minutos, video_url")
          .eq("patient_id", data.patientId)
          .eq("professional_id", prof.id)
          .order("inicio", { ascending: false }),
        supabase
          .from("appointment_notes")
          .select("id, appointment_id, conteudo, created_at, updated_at")
          .eq("patient_id", data.patientId)
          .eq("professional_id", prof.id)
          .order("created_at", { ascending: false }),
      ]);

    if (!perfil) {
      return {
        ok: false as const,
        erro: "Você só pode acessar a ficha de pacientes com consulta confirmada com você.",
      };
    }
    return {
      ok: true as const,
      paciente: { ...perfil, nome: perfil.nome?.trim().split(/\s+/)[0] ?? null },
      ficha: ficha ?? null,
      consultas: consultas ?? [],
      anotacoes: anotacoes ?? [],
    };
  });

export const salvarFichaPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      patientId: string;
      informacoes_relevantes?: string;
      diagnostico?: string;
      historico?: string;
      observacoes?: string;
      evolucao?: string;
    }) => {
      const t = (v: unknown) => String(v ?? "").trim().slice(0, 8000) || null;
      return {
        patientId: String(data.patientId),
        informacoes_relevantes: t(data.informacoes_relevantes),
        diagnostico: t(data.diagnostico),
        historico: t(data.historico),
        observacoes: t(data.observacoes),
        evolucao: t(data.evolucao),
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { ok: false as const, erro: "Cadastro profissional não encontrado." };
    const { patientId, ...campos } = data;
    const { data: vinculo } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", patientId)
      .eq("professional_id", prof.id)
      .in("status", ["confirmada", "realizada", "nao_compareceu", "remarcada"])
      .limit(1)
      .maybeSingle();
    if (!vinculo) return { ok: false as const, erro: "Paciente não vinculado ao seu atendimento." };
    const { error } = await supabase
      .from("patient_clinical_records")
      .upsert(
        { patient_id: patientId, professional_id: prof.id, ...campos },
        { onConflict: "patient_id,professional_id" },
      );
    if (error) {
      return { ok: false as const, erro: "Não foi possível salvar. Verifique se há consulta confirmada com este paciente." };
    }
    return { ok: true as const };
  });

export const adicionarAnotacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { appointmentId: string; conteudo: string }) => ({
    appointmentId: String(data.appointmentId),
    conteudo: String(data.conteudo ?? "").trim().slice(0, 8000),
  }))
  .handler(async ({ data, context }) => {
    if (!data.conteudo) return { ok: false as const, erro: "Escreva a anotação." };
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { ok: false as const, erro: "Cadastro profissional não encontrado." };
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id, patient_id, professional_id, status")
      .eq("id", data.appointmentId)
      .eq("professional_id", prof.id)
      .maybeSingle();
    if (!consulta || !["confirmada", "realizada"].includes(consulta.status)) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    const { error } = await supabase.from("appointment_notes").insert({
      appointment_id: consulta.id,
      professional_id: prof.id,
      patient_id: consulta.patient_id,
      conteudo: data.conteudo,
    });
    if (error) {
      return { ok: false as const, erro: "Anotações só podem ser feitas em consultas confirmadas ou realizadas." };
    }
    return { ok: true as const };
  });

export const anotacoesDaConsulta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { appointmentId: string }) => ({ appointmentId: String(data.appointmentId) }))
  .handler(async ({ data, context }) => {
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { anotacoes: [] };
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", data.appointmentId)
      .eq("professional_id", prof.id)
      .in("status", ["confirmada", "realizada"])
      .maybeSingle();
    if (!consulta) return { anotacoes: [] };
    const { data: rows } = await supabase
      .from("appointment_notes")
      .select("id, conteudo, created_at")
      .eq("appointment_id", data.appointmentId)
      .eq("professional_id", prof.id)
      .order("created_at", { ascending: false });
    return { anotacoes: rows ?? [] };
  });

/* ---------- financeiro ---------- */

export type LancamentoFinanceiro = {
  id: string;
  inicio: string;
  status: string;
  paciente: string;
  codigo: string | null;
  bruto: number;
  taxaAgendamento: number;
  plataforma: number;
  liquido: number;
  comissaoPercent: number;
  situacao: "agendada" | "a_receber" | "pago" | "cancelada" | "nao_compareceu" | "aguardando_pagamento";
  pagoEm: string | null;
  previstoPara: string | null;
};

export const financeiroProfissional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, prof } = await profissionalDoUsuario(context);
    if (!prof) return { profissional: null, lancamentos: [] as LancamentoFinanceiro[], resumo: null };

    const { concluirConsultasVencidas } = await import("@/lib/plataforma.functions");
    await concluirConsultasVencidas();

    const [{ data: consultas }, { data: payouts }] = await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, inicio, status, payment_status, patient_id, valor_consulta_centavos, taxa_agendamento_centavos, valor_plataforma_centavos, valor_profissional_centavos, comissao_percent",
        )
        .eq("professional_id", prof.id)
        .order("inicio", { ascending: false })
        .limit(300),
      supabase
        .from("payouts")
        .select("id, appointment_id, status, pago_em, previsto_para, valor_centavos")
        .eq("professional_id", prof.id),
    ]);

    const ids = [...new Set((consultas ?? []).map((c) => c.patient_id))];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfis } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, nome, codigo_anonimo").in("id", ids)
      : { data: [] as { id: string; nome: string | null; codigo_anonimo: string | null }[] };
    const perfilPorId = new Map(
      (perfis ?? []).map((p) => [p.id, { ...p, nome: p.nome?.trim().split(/\s+/)[0] ?? null }]),
    );
    const payoutPorConsulta = new Map((payouts ?? []).map((p) => [p.appointment_id, p]));

    const lancamentos: LancamentoFinanceiro[] = (consultas ?? []).map((c) => {
      const comissao = Number(c.comissao_percent ?? 20);
      const bruto = c.valor_consulta_centavos ?? 0;
      const plataforma = Math.round((bruto * comissao) / 100);
      const liquido = bruto - plataforma;
      const payout = payoutPorConsulta.get(c.id);
      let situacao: LancamentoFinanceiro["situacao"] = "agendada";
      if (c.status === "aguardando_pagamento") situacao = "aguardando_pagamento";
      else if (c.status === "cancelada") situacao = "cancelada";
      else if (c.status === "nao_compareceu") situacao = "nao_compareceu";
      else if (c.status === "realizada") situacao = payout?.status === "pago" ? "pago" : "a_receber";
      const rotulo = rotuloPaciente(perfilPorId.get(c.patient_id), c.patient_id);
      return {
        id: c.id,
        inicio: c.inicio,
        status: c.status,
        paciente: rotulo.paciente,
        codigo: rotulo.codigo,
        bruto,
        taxaAgendamento: c.taxa_agendamento_centavos ?? 0,
        plataforma,
        liquido,
        comissaoPercent: comissao,
        situacao,
        pagoEm: payout?.pago_em ?? null,
        previstoPara: payout?.previsto_para ?? null,
      };
    });

    const soma = (f: (l: LancamentoFinanceiro) => boolean) =>
      lancamentos.filter(f).reduce((s, l) => s + l.liquido, 0);
    const resumo = {
      futurosBruto: lancamentos.filter((l) => l.situacao === "agendada").reduce((s, l) => s + l.bruto, 0),
      futurosLiquido: soma((l) => l.situacao === "agendada"),
      aReceber: soma((l) => l.situacao === "a_receber"),
      recebido: soma((l) => l.situacao === "pago"),
      taxasAgendamento: lancamentos
        .filter((l) => l.situacao !== "aguardando_pagamento" && l.situacao !== "cancelada")
        .reduce((s, l) => s + l.taxaAgendamento, 0),
      comissaoPercent: Number(prof.comissao_percent ?? 20),
      consultasRealizadas: lancamentos.filter((l) => l.situacao === "a_receber" || l.situacao === "pago").length,
      consultasAgendadas: lancamentos.filter((l) => l.situacao === "agendada").length,
    };

    return { profissional: prof, lancamentos, resumo };
  });
