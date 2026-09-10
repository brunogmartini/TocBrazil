import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { gerarSalaVideo } from "@/lib/video-sala";

export type ProfissionalPublico = {
  id: string;
  slug: string;
  nome: string;
  profissao: "psicologo" | "psiquiatra";
  registro: string;
  uf: string;
  foto_url: string | null;
  abordagem: string | null;
  apresentacao: string | null;
  experiencia_toc: string | null;
  experiencia_anos: number;
  cidade: string | null;
  graduacao: string | null;
  instituicao: string | null;
  cursos: string[];
  formacao: string[];

  especializacoes: string[];
  areas: string[];
  idiomas: string[];
  genero: string | null;
  slot_minutos: number;
};

function clientePublico() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const CAMPOS =
  "id, slug, nome, profissao, registro, uf, cidade, foto_url, abordagem, apresentacao, experiencia_toc, experiencia_anos, graduacao, instituicao, cursos, formacao, especializacoes, areas, idiomas, genero, slot_minutos";


export const listarProfissionais = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await clientePublico()
    .from("professionals")
    .select(CAMPOS)
    .eq("status", "aprovado")
    .order("nome");
  if (error) return { profissionais: [] as ProfissionalPublico[], erro: error.message };
  return { profissionais: (data ?? []) as ProfissionalPublico[], erro: null as string | null };
});

export const obterProfissional = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug) }))
  .handler(async ({ data }) => {
    const { data: row } = await clientePublico()
      .from("professionals")
      .select(CAMPOS)
      .eq("slug", data.slug)
      .eq("status", "aprovado")
      .maybeSingle();
    return { profissional: (row ?? null) as ProfissionalPublico | null };
  });

export const listarHorariosLivres = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string; dias?: number }) => ({
    slug: String(data.slug),
    dias: Math.min(Math.max(Number(data.dias ?? 21), 1), 60),
  }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await clientePublico().rpc("slots_disponiveis", {
      _slug: data.slug,
      _dias: data.dias,
    });
    if (error) return { horarios: [] as { inicio: string; fim: string }[], erro: error.message };
    return {
      horarios: (rows ?? []) as { inicio: string; fim: string }[],
      erro: null as string | null,
    };
  });

export type ConfiguracoesPlataforma = {
  taxaCentavos: number;
  comissaoPercent: number;
  duracaoPadraoMinutos: number;
  cancelamentoHoras: number;
  remarcacaoHoras: number;
  reembolsoTaxaNoPrazo: boolean;
  hotmartLivroUrl: string;
  livroTitulo: string;
  livroDescontoPercent: number;
  videoProvider: string;
};

export function mapearConfiguracoes(rows: { chave: string; valor: unknown }[] | null) {
  const mapa: Record<string, unknown> = {};
  for (const row of rows ?? []) mapa[row.chave] = row.valor;
  const cfg: ConfiguracoesPlataforma = {
    taxaCentavos: Number(mapa["taxa_confirmacao_centavos"] ?? 5000),
    comissaoPercent: Number(mapa["comissao_plataforma_percent"] ?? 25),
    duracaoPadraoMinutos: Number(mapa["duracao_padrao_minutos"] ?? 50),
    cancelamentoHoras: Number(mapa["cancelamento_horas_minimas"] ?? 24),
    remarcacaoHoras: Number(mapa["remarcacao_horas_minimas"] ?? 24),
    reembolsoTaxaNoPrazo: Boolean(mapa["reembolso_taxa_no_prazo"] ?? true),
    hotmartLivroUrl: String(mapa["hotmart_livro_url"] ?? ""),
    livroTitulo: String(mapa["livro_titulo"] ?? "Como Ser Feliz com TOC"),
    livroDescontoPercent: Number(mapa["livro_desconto_percent"] ?? 50),
    videoProvider: String(mapa["video_provider"] ?? "jitsi"),
  };
  return cfg;
}

export const configuracoesPlataforma = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await clientePublico().from("platform_settings").select("chave, valor");
  return mapearConfiguracoes(data);
});

/* ---------- área autenticada ---------- */

export const meuContexto = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: perfil }, { data: papeis }, { data: profissional }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("professionals").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      perfil: perfil ?? null,
      papeis: (papeis ?? []).map((p) => p.role as string),
      profissional: profissional ?? null,
    };
  });

export const salvarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome: string; telefone?: string; data_nascimento?: string | null }) => ({
    nome: String(data.nome).trim().slice(0, 120),
    telefone: data.telefone ? String(data.telefone).trim().slice(0, 30) : null,
    data_nascimento: data.data_nascimento || null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      nome: data.nome,
      email: (claims as { email?: string }).email ?? null,
      telefone: data.telefone,
      data_nascimento: data.data_nascimento,
    });
    if (error) throw new Error(error.message);
    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "paciente" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
    return { ok: true };
  });

/**
 * Consultas confirmadas cujo horário final já passou viram "realizada".
 * Executado pelo servidor (papel de serviço) sempre que uma agenda é carregada.
 */
export async function concluirConsultasVencidas() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("concluir_consultas_vencidas");
  } catch {
    /* sem impacto para o usuário */
  }
}

export const minhasConsultas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await concluirConsultasVencidas();
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, inicio, fim, status, payment_status, valor_centavos, taxa_agendamento_centavos, valor_consulta_centavos, duracao_minutos, video_url, cancelada_em, professionals(nome, profissao, slug, registro)",
      )
      .eq("patient_id", userId)
      .order("inicio", { ascending: false });
    if (error) throw new Error(error.message);
    return { consultas: data ?? [] };
  });

export const criarAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; inicio: string }) => ({
    slug: String(data.slug),
    inicio: String(data.inicio),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: prof, error: erroProf } = await supabase
      .from("professionals")
      .select("id, slug, nome, slot_minutos, comissao_percent, status, valor_centavos")
      .eq("slug", data.slug)
      .maybeSingle();
    if (erroProf || !prof || prof.status !== "aprovado") {
      return { ok: false as const, erro: "Profissional indisponível." };
    }

    const { data: livres } = await supabase.rpc("slots_disponiveis", {
      _slug: data.slug,
      _dias: 60,
    });
    const inicioIso = new Date(data.inicio).toISOString();
    const disponivel = (livres ?? []).some(
      (s: { inicio: string }) => new Date(s.inicio).toISOString() === inicioIso,
    );
    if (!disponivel) {
      return { ok: false as const, erro: "Este horário acabou de ser reservado. Escolha outro." };
    }

    const { data: cfgRows } = await supabase.from("platform_settings").select("chave, valor");
    const cfg = mapearConfiguracoes(cfgRows);

    // Taxa de agendamento (plataforma) cobrada agora; valor da consulta só
    // vira crédito do profissional depois que a consulta for realizada.
    const taxa = cfg.taxaCentavos;
    const valorConsulta = Number(prof.valor_centavos ?? 0);
    const comissao = cfg.comissaoPercent;
    const plataforma = Math.round((valorConsulta * comissao) / 100);
    const duracao = prof.slot_minutos || cfg.duracaoPadraoMinutos;
    const fim = new Date(new Date(inicioIso).getTime() + duracao * 60000).toISOString();

    const consultaId = crypto.randomUUID();
    const sala = gerarSalaVideo(cfg.videoProvider, consultaId);

    const { data: criada, error } = await supabase
      .from("appointments")
      .insert({
        id: consultaId,
        patient_id: userId,
        professional_id: prof.id,
        inicio: inicioIso,
        fim,
        duracao_minutos: duracao,
        status: "aguardando_pagamento",
        payment_status: "pendente",
        valor_centavos: taxa,
        taxa_agendamento_centavos: taxa,
        valor_consulta_centavos: valorConsulta,
        comissao_percent: comissao,
        valor_plataforma_centavos: plataforma,
        valor_profissional_centavos: valorConsulta - plataforma,
        video_url: sala.url,
        video_provider: sala.provider,
      })
      .select("id, inicio, fim, valor_centavos")
      .single();

    if (error) {
      const duplicado = error.message.includes("appointments_slot_unico");
      return {
        ok: false as const,
        erro: duplicado
          ? "Este horário acabou de ser reservado. Escolha outro."
          : "Não foi possível concluir a reserva agora.",
      };
    }

    const quando = new Date(criada.inicio).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    await supabase.from("notifications").insert([
      {
        user_id: userId,
        appointment_id: criada.id,
        tipo: "reserva_criada",
        canal: "email",
        titulo: "Reserva registrada",
        corpo: `Seu horário com ${prof.nome} em ${quando} está reservado e aguarda a confirmação do pagamento da taxa de agendamento.`,
      },
      {
        user_id: userId,
        appointment_id: criada.id,
        tipo: "lembrete_24h",
        canal: "email",
        titulo: "Sua consulta é amanhã",
        corpo: `Lembrete: consulta com ${prof.nome} em ${quando}.`,
        agendada_para: new Date(new Date(criada.inicio).getTime() - 24 * 3600_000).toISOString(),
      },
      {
        user_id: userId,
        appointment_id: criada.id,
        tipo: "lembrete_1h",
        canal: "email",
        titulo: "Sua consulta começa em 1 hora",
        corpo: `Consulta com ${prof.nome} às ${quando}.`,
        agendada_para: new Date(new Date(criada.inicio).getTime() - 3600_000).toISOString(),
      },
    ]);

    return { ok: true as const, consultaId: criada.id, valorCentavos: criada.valor_centavos };
  });

export const cancelarConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id, inicio, patient_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.status === "realizada" || consulta.status === "cancelada") {
      return { ok: false as const, erro: "Esta consulta não pode mais ser cancelada." };
    }
    const { data: cfgRows } = await supabase.from("platform_settings").select("chave, valor");
    const cfg = mapearConfiguracoes(cfgRows);
    const horasAntes = (new Date(consulta.inicio).getTime() - Date.now()) / 3600_000;
    const dentroDoPrazo = horasAntes >= cfg.cancelamentoHoras;

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelada",
        cancelada_em: new Date().toISOString(),
        cancelada_por: "paciente",
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível cancelar agora." };

    await supabase.from("notifications").insert({
      user_id: userId,
      appointment_id: consulta.id,
      tipo: "consulta_cancelada",
      canal: "email",
      titulo: "Consulta cancelada",
      corpo: dentroDoPrazo
        ? cfg.reembolsoTaxaNoPrazo
          ? "Cancelamento dentro do prazo. A taxa de agendamento será estornada pela nossa equipe."
          : "Cancelamento registrado dentro do prazo."
        : `Cancelamento fora do prazo de ${cfg.cancelamentoHoras}h. A taxa de agendamento não é reembolsável.`,
    });
    return { ok: true as const, dentroDoPrazo };
  });

/* ---------- livro "Como Ser Feliz com TOC" ---------- */

export const meuLivro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: compra }, { data: cfgRows }] = await Promise.all([
      supabase
        .from("livro_compras")
        .select("status, clicado_em, comprado_em")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("platform_settings").select("chave, valor"),
    ]);
    const cfg = mapearConfiguracoes(cfgRows);
    return {
      status: (compra?.status ?? "nao_comprado") as
        | "nao_comprado"
        | "pendente"
        | "confirmada"
        | "cancelada",
      clicadoEm: compra?.clicado_em ?? null,
      compradoEm: compra?.comprado_em ?? null,
      url: cfg.hotmartLivroUrl,
      titulo: cfg.livroTitulo,
      descontoPercent: cfg.livroDescontoPercent,
    };
  });

export const registrarInteresseLivro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;
    const { data: atual } = await supabase
      .from("livro_compras")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (atual?.status === "confirmada") return { ok: true as const };
    const { error } = await supabase.from("livro_compras").upsert(
      {
        ...(atual ? { id: atual.id } : {}),
        user_id: userId,
        email,
        status: "pendente",
        clicado_em: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) return { ok: false as const, erro: "Não foi possível registrar agora." };
    return { ok: true as const };
  });

export const minhasNotificacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("notifications")
      .select("id, tipo, titulo, corpo, agendada_para, lida_em")
      .eq("user_id", userId)
      .order("agendada_para", { ascending: true })
      .limit(30);
    return { notificacoes: data ?? [] };
  });

/* ---------- avaliações ---------- */

export type AvaliacaoPublica = {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

export const avaliacoesDoProfissional = createServerFn({ method: "GET" })
  .inputValidator((data: { professionalId: string }) => ({
    professionalId: String(data.professionalId),
  }))
  .handler(async ({ data }) => {
    const cliente = clientePublico();
    const [{ data: rows }, { data: resumo }] = await Promise.all([
      cliente
        .from("avaliacoes")
        .select("id, nota, comentario, created_at")
        .eq("professional_id", data.professionalId)
        .eq("publica", true)
        .order("created_at", { ascending: false })
        .limit(20),
      cliente.rpc("avaliacoes_resumo", { _professional_id: data.professionalId }),
    ]);
    const linha = (resumo ?? [])[0] as { media: number; total: number } | undefined;
    return {
      avaliacoes: (rows ?? []) as AvaliacaoPublica[],
      media: Number(linha?.media ?? 0),
      total: Number(linha?.total ?? 0),
    };
  });

export const minhasAvaliacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("avaliacoes")
      .select("id, appointment_id, professional_id, nota, comentario")
      .eq("patient_id", userId);
    return { avaliacoes: data ?? [] };
  });

export const salvarAvaliacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { consultaId: string; nota: number; comentario?: string }) => ({
    consultaId: String(data.consultaId),
    nota: Math.min(Math.max(Math.round(Number(data.nota)), 1), 5),
    comentario: data.comentario ? String(data.comentario).trim().slice(0, 800) : null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id, patient_id, professional_id, status")
      .eq("id", data.consultaId)
      .maybeSingle();
    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.status !== "realizada") {
      return { ok: false as const, erro: "Você pode avaliar depois que a consulta acontecer." };
    }
    const { error } = await supabase.from("avaliacoes").upsert(
      {
        appointment_id: consulta.id,
        patient_id: userId,
        professional_id: consulta.professional_id,
        nota: data.nota,
        comentario: data.comentario,
      },
      { onConflict: "appointment_id" },
    );
    if (error) return { ok: false as const, erro: "Não foi possível salvar sua avaliação." };
    return { ok: true as const };
  });
