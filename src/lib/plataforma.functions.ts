import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { areaDosPapeis, type Papel } from "@/lib/areas";

export type ProfissionalPublico = {
  id: string;
  slug: string;
  nome: string;
  profissao: "psicologo";
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
  valor_centavos: number;
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
  "id, slug, nome, profissao, registro, uf, cidade, foto_url, abordagem, apresentacao, experiencia_toc, experiencia_anos, graduacao, instituicao, cursos, formacao, especializacoes, areas, idiomas, genero, slot_minutos, valor_centavos";


async function expirarReservas() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("expirar_reservas_vencidas");
  } catch {
    // manutenção silenciosa: não bloqueia a listagem pública
  }
}

export type ProfissionalComHorarios = ProfissionalPublico & { proximos: string[] };

export const listarProfissionais = createServerFn({ method: "GET" }).handler(async () => {
  const cliente = clientePublico();
  await expirarReservas();
  const { data, error } = await cliente
    .from("professionals")
    .select(CAMPOS)
    .eq("status", "aprovado")
    .order("nome");
  if (error) {
    console.error("Falha ao listar profissionais", { code: error.code });
    return {
      profissionais: [] as ProfissionalComHorarios[],
      erro: "Não foi possível carregar os profissionais agora.",
    };
  }
  const { data: horarios } = await cliente.rpc("proximos_horarios", { _dias: 21, _limite: 5 });
  const porSlug = new Map<string, string[]>();
  for (const h of (horarios ?? []) as { slug: string; inicio: string }[]) {
    const lista = porSlug.get(h.slug) ?? [];
    lista.push(h.inicio);
    porSlug.set(h.slug, lista);
  }
  const profissionais = ((data ?? []) as ProfissionalPublico[]).map((p) => ({
    ...p,
    proximos: porSlug.get(p.slug) ?? [],
  }));
  return { profissionais, erro: null as string | null };
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
    const cliente = clientePublico();
    await expirarReservas();
    const { data: rows, error } = await cliente.rpc("slots_disponiveis", {
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
  /** Taxa fixa em centavos cobrada do profissional por consulta realizada. */
  taxaPorConsultaCentavos: number;
  janelaCancelamentoHoras: number;
  antecedenciaLinkMinutos: number;
  janelaConfirmacaoHoras: number;
  duracaoPadraoMinutos: number;
  cancelamentoHoras: number;
  remarcacaoHoras: number;
  reembolsoTaxaNoPrazo: boolean;
};

export function mapearConfiguracoes(rows: { chave: string; valor: unknown }[] | null) {
  const mapa: Record<string, unknown> = {};
  for (const row of rows ?? []) mapa[row.chave] = row.valor;
  const cfg: ConfiguracoesPlataforma = {
    taxaPorConsultaCentavos: Number(mapa["taxa_por_consulta_centavos"] ?? 2900),
    janelaCancelamentoHoras: Number(mapa["janela_cancelamento_horas"] ?? 24),
    antecedenciaLinkMinutos: Number(mapa["antecedencia_link_minutos"] ?? 15),
    janelaConfirmacaoHoras: Number(mapa["janela_confirmacao_horas"] ?? 24),
    duracaoPadraoMinutos: Number(mapa["duracao_padrao_minutos"] ?? 50),
    cancelamentoHoras: Number(mapa["janela_cancelamento_horas"] ?? mapa["cancelamento_horas_minimas"] ?? 24),
    remarcacaoHoras: Number(mapa["remarcacao_horas_minimas"] ?? 24),
    reembolsoTaxaNoPrazo: Boolean(mapa["reembolso_taxa_no_prazo"] ?? true),
  };
  return cfg;
}

async function carregarConfiguracoesPrivadas() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("platform_settings").select("chave, valor");
  return mapearConfiguracoes(data);
}

/** Uso interno do servidor (outras server functions). */
export async function configuracoesPlataformaServidor() {
  return carregarConfiguracoesPrivadas();
}

export const configuracoesAutenticadas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => carregarConfiguracoesPrivadas());

/* ---------- área autenticada ---------- */

/**
 * Papéis reais da conta e a área a que ela pertence.
 * Uma conta recém-criada ainda não tem papel: aqui ele é fixado uma única vez,
 * a partir da intenção declarada no cadastro ("Sou paciente" / "Sou profissional").
 * Depois disso o papel nunca muda por escolha do usuário — só o gestor altera.
 */
export const meusPapeis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { perfil?: string }) => ({
    perfil: data?.perfil === "profissional" ? ("profissional" as const) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { data: linhas } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    let papeis = (linhas ?? []).map((p) => p.role as Papel);

    if (papeis.length === 0) {
      const metadados = (claims as { user_metadata?: { perfil?: string } }).user_metadata;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: cadastroProfissional } = await supabaseAdmin
        .from("professionals")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      const papel: Papel =
        cadastroProfissional || data.perfil === "profissional" || metadados?.perfil === "profissional"
          ? "profissional"
          : "paciente";
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: papel }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
      papeis = [papel];
    }

    return { papeis, area: areaDosPapeis(papeis) };
  });

export const meuContexto = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: perfil }, { data: papeis }, { data: profissional }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      // Sem telefone/e-mail de contato: contatos só são lidos na tela de cadastro do próprio profissional.
      supabase
        .from("professionals")
        .select(
          "id, user_id, slug, nome, profissao, registro, uf, cidade, foto_url, abordagem, apresentacao, experiencia_toc, experiencia_anos, formacao, especializacoes, areas, idiomas, genero, status, slot_minutos, valor_centavos, destaque, graduacao, instituicao, cursos, observacao_admin, requer_correcao, created_at, updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return {
      perfil: perfil ?? null,
      papeis: (papeis ?? []).map((p) => p.role as string),
      profissional: profissional ?? null,
    };
  });

async function profissionaisDasConsultas(
  supabase: import("@supabase/supabase-js").SupabaseClient<Database>,
) {
  const { data } = await supabase.rpc("profissionais_das_minhas_consultas");
  return new Map((data ?? []).map((p) => [p.id, p]));
}

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

/** Registra apenas metadados administrativos (nunca conteúdo de atendimento). */
export async function registrarEvento(evento: {
  tipo: string;
  appointmentId?: string | null;
  professionalId?: string | null;
  ator?: string | null;
  atorPapel?: string | null;
  metadados?: Record<string, string | number | boolean | null>;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("eventos_auditoria").insert({
      tipo: evento.tipo,
      appointment_id: evento.appointmentId ?? null,
      professional_id: evento.professionalId ?? null,
      ator: evento.ator ?? null,
      ator_papel: evento.atorPapel ?? null,
      metadados: evento.metadados ?? {},
    });
  } catch {
    /* auditoria não bloqueia o usuário */
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
        "id, inicio, fim, status, payment_status, valor_centavos, taxa_agendamento_centavos, valor_consulta_centavos, duracao_minutos, link_acesso, cancelada_em, professional_id",
      )
      .eq("patient_id", userId)
      .order("inicio", { ascending: false });
    if (error) throw new Error(error.message);

    const [cfg, profissionais] = await Promise.all([
      carregarConfiguracoesPrivadas(),
      profissionaisDasConsultas(supabase),
    ]);
    const agora = Date.now();
    const revelados: string[] = [];
    const consultas = (data ?? []).map((c) => {
      const inicio = new Date(c.inicio).getTime();
      const fim = new Date(c.fim).getTime();
      const dentroDaJanela =
        agora >= inicio - cfg.antecedenciaLinkMinutos * 60000 && agora <= fim + 2 * 3600_000;
      const liberado = c.status === "confirmada" && dentroDaJanela && Boolean(c.link_acesso);
      if (liberado) revelados.push(c.id);
      return {
        ...c,
        professionals: profissionais.get(c.professional_id) ?? null,
        link_acesso: liberado ? c.link_acesso : null,
        linkLiberado: liberado,
        linkLiberadoEm: new Date(inicio - cfg.antecedenciaLinkMinutos * 60000).toISOString(),
        antecedenciaLinkMinutos: cfg.antecedenciaLinkMinutos,
      };
    });
    for (const id of revelados) {
      await registrarEvento({
        tipo: "acesso_link",
        appointmentId: id,
        ator: userId,
        atorPapel: "paciente",
      });
    }
    return { consultas };
  });

/** Consulta acontece fora da plataforma: o paciente pode confirmar que ela ocorreu. */
export const confirmarRealizacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id, fim, status, patient_id, professional_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.status !== "confirmada") {
      return { ok: false as const, erro: "Esta consulta não pode ser confirmada." };
    }
    if (new Date(consulta.fim).getTime() > Date.now()) {
      return { ok: false as const, erro: "Você pode confirmar depois do horário de término." };
    }
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "realizada",
        realizada_em: agora,
        confirmado_realizado_por: "paciente",
        confirmado_em: agora,
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível confirmar agora." };
    await registrarEvento({
      tipo: "realizacao_confirmada",
      appointmentId: consulta.id,
      professionalId: consulta.professional_id,
      ator: userId,
      atorPapel: "paciente",
    });
    return { ok: true as const };
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
      .select("id, slug, nome, slot_minutos, status, valor_centavos, ferramenta_url_sala")
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

    const cfg = await carregarConfiguracoesPrivadas();

    // O paciente paga exatamente o preço definido pelo profissional. A taxa fixa
    // da plataforma é cobrada do profissional e não compõe o preço.
    const valorConsulta = Number(prof.valor_centavos ?? 0);
    const taxaFixa = cfg.taxaPorConsultaCentavos;
    const duracao = prof.slot_minutos || cfg.duracaoPadraoMinutos;
    const fim = new Date(new Date(inicioIso).getTime() + duracao * 60000).toISOString();

    const consultaId = crypto.randomUUID();
    // A sala de videochamada é do próprio profissional; guardamos apenas o link.
    const linkAcesso = prof.ferramenta_url_sala ?? null;

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
        valor_centavos: valorConsulta,
        taxa_agendamento_centavos: 0,
        valor_consulta_centavos: valorConsulta,
        comissao_percent: 0,
        valor_plataforma_centavos: 0,
        valor_profissional_centavos: valorConsulta,
        taxa_plataforma_centavos: taxaFixa,
        link_acesso: linkAcesso,
        video_url: linkAcesso,
        video_provider: "externo",
        reserva_expira_em: new Date(Date.now() + 15 * 60000).toISOString(),
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
        corpo: `Seu horário com ${prof.nome} em ${quando} está reservado por 15 minutos e aguarda a confirmação do pagamento.`,
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
        tipo: "lembrete_15min",
        canal: "email",
        titulo: "Sua consulta começa em 15 minutos",
        corpo: `Consulta com ${prof.nome} às ${quando}. O endereço da sala já está disponível na sua área.`,
        agendada_para: new Date(new Date(criada.inicio).getTime() - 15 * 60000).toISOString(),
      },
    ]);

    await registrarEvento({
      tipo: "reserva_criada",
      appointmentId: criada.id,
      professionalId: prof.id,
      ator: userId,
      atorPapel: "paciente",
      metadados: { inicio: criada.inicio },
    });

    return { ok: true as const, consultaId: criada.id, valorCentavos: criada.valor_centavos };
  });

export const cancelarConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select("id, inicio, patient_id, status, payment_status")
      .eq("id", data.id)
      .maybeSingle();
    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.status === "realizada" || consulta.status === "cancelada") {
      return { ok: false as const, erro: "Esta consulta não pode mais ser cancelada." };
    }
    const cfg = await carregarConfiguracoesPrivadas();
    const horasAntes = (new Date(consulta.inicio).getTime() - Date.now()) / 3600_000;
    const dentroDoPrazo = horasAntes >= cfg.cancelamentoHoras;

    // Cancelamento tardio de consulta já paga conta como não comparecimento e
    // gera a taxa fixa devida pelo profissional, conforme as regras da plataforma.
    const novoStatus =
      !dentroDoPrazo && consulta.status === "confirmada" ? "nao_compareceu" : "cancelada";

    const { error } = await supabase
      .from("appointments")
      .update({
        status: novoStatus,
        cancelada_em: new Date().toISOString(),
        cancelada_por: "paciente",
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível cancelar agora." };

    // Estorno pelo provedor quando o cancelamento é dentro do prazo e já houve pagamento.
    let estornado = false;
    if (dentroDoPrazo && consulta.payment_status === "aprovado" && cfg.reembolsoTaxaNoPrazo) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: pg } = await supabaseAdmin
        .from("payments")
        .select("id, provider_ref")
        .eq("appointment_id", consulta.id)
        .eq("status", "aprovado")
        .maybeSingle();
      if (pg?.provider_ref) {
        const { provedorPagamento } = await import("@/services/payments.server");
        const respostaEstorno = await provedorPagamento().refund(pg.provider_ref);
        if (respostaEstorno.ok) {
          estornado = true;
          await supabaseAdmin
            .from("payments")
            .update({ status: "estornado" })
            .eq("id", pg.id);
          await supabaseAdmin
            .from("appointments")
            .update({ payment_status: "estornado" })
            .eq("id", consulta.id);
          await registrarEvento({
            tipo: "estorno_realizado",
            appointmentId: consulta.id,
            ator: userId,
            atorPapel: "paciente",
          });
        }
      }
    }


    await registrarEvento({
      tipo: dentroDoPrazo ? "cancelamento_no_prazo" : "cancelamento_tardio",
      appointmentId: consulta.id,
      ator: userId,
      atorPapel: "paciente",
      metadados: { horasAntes: Math.round(horasAntes), status: novoStatus },
    });

    await supabase.from("notifications").insert({
      user_id: userId,
      appointment_id: consulta.id,
      tipo: "consulta_cancelada",
      canal: "email",
      titulo: "Consulta cancelada",
      corpo: dentroDoPrazo
        ? estornado
          ? "Cancelamento dentro do prazo. O estorno já foi solicitado ao meio de pagamento."
          : cfg.reembolsoTaxaNoPrazo
            ? "Cancelamento dentro do prazo. O valor pago será estornado pela nossa equipe."
            : "Cancelamento registrado dentro do prazo."
        : `Cancelamento fora do prazo de ${cfg.cancelamentoHoras}h: o valor pago não é reembolsável.`,
    });
    return { ok: true as const, dentroDoPrazo, estornado };

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
        .from("avaliacoes_publicas")
        .select("id, nota, comentario, created_at")
        .eq("professional_id", data.professionalId)
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
    if (error) return { ok: false as const, erro: "Não foi possível salvar sua consulta." };
    return { ok: true as const };
  });
