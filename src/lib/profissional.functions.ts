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
    const profissao = data.profissao === "psiquiatra" ? "psiquiatra" : "psicologo";
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

    await supabase.from("user_roles").upsert(
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

export const minhaAgendaProfissional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("professionals")
      .select("id, nome, slug, status, slot_minutos, comissao_percent")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { profissional: null, consultas: [], ganhos: null };

    const [{ data: consultas }, { data: pagamentos }] = await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, inicio, fim, status, payment_status, valor_centavos, valor_profissional_centavos, video_url, profiles(nome)",
        )
        .eq("professional_id", prof.id)
        .order("inicio", { ascending: false })
        .limit(100),
      supabase
        .from("payments")
        .select("id, status, valor_profissional_centavos, created_at")
        .eq("professional_id", prof.id),
    ]);

    const aprovados = (pagamentos ?? []).filter((p) => p.status === "aprovado");
    const recebido = aprovados.reduce((s, p) => s + (p.valor_profissional_centavos ?? 0), 0);
    const previsto = (consultas ?? [])
      .filter((c) => c.status === "confirmada" || c.status === "aguardando_pagamento")
      .reduce((s, c) => s + (c.valor_profissional_centavos ?? 0), 0);

    return {
      profissional: prof,
      consultas: consultas ?? [],
      ganhos: { recebidoCentavos: recebido, previstoCentavos: previsto },
    };
  });

export const marcarConsultaRealizada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "realizada" | "nao_compareceu" | "cancelada" }) => ({
    id: String(data.id),
    status: data.status,
  }))
  .handler(async ({ data, context }) => {
    const extra =
      data.status === "cancelada"
        ? { cancelada_em: new Date().toISOString(), cancelada_por: "profissional" }
        : {};
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: data.status, ...extra })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar a consulta." };
    return { ok: true as const };
  });
