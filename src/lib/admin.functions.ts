import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcularEtapa, type EtapaCadastro } from "@/lib/profissional.functions";
import { mapearConfiguracoes, type ConfiguracoesPlataforma } from "@/lib/plataforma.functions";

export type PacienteAdmin = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  codigo: string | null;
  criadoEm: string;
  papeis: string[];
  cadastroCompleto: boolean;
  consultas: number;
  consultasRealizadas: number;
  pagoCentavos: number;
  livroStatus: "nao_comprado" | "pendente" | "confirmada" | "cancelada";
  livroClicadoEm: string | null;
  livroCompradoEm: string | null;
};

export type ConsultaAdmin = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  payment_status: string;
  taxa_centavos: number;
  valor_consulta_centavos: number;
  valor_plataforma_centavos: number;
  valor_profissional_centavos: number;
  paciente: string;
  profissional: string;
  video_url: string | null;
};

export type RepasseAdmin = {
  id: string;
  profissional: string;
  professional_id: string;
  consultaInicio: string | null;
  bruto: number;
  plataforma: number;
  liquido: number;
  status: string;
  previstoPara: string | null;
  pagoEm: string | null;
  observacao: string | null;
  chavePix: string | null;
};

export type ProfissionalAdmin = {
  id: string;
  user_id: string | null;
  nome: string;
  slug: string;
  profissao: string;
  registro: string;
  uf: string;
  cidade: string | null;
  status: string;
  requer_correcao: boolean;
  etapa: EtapaCadastro;
  valor_centavos: number;
  comissao_percent: number;
  consultas: number;
  consultasRealizadas: number;
  telefone: string | null;
  email_contato: string | null;
  email_login: string | null;
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
  temAgenda: boolean;
  criadoEm: string;
  documentos: {
    id: string;
    tipo: string;
    nome_arquivo: string;
    status: string;
    observacao_admin: string | null;
    created_at: string;
    url: string | null;
  }[];
  historico: {
    id: string;
    status_anterior: string | null;
    status_novo: string;
    requer_correcao: boolean;
    observacao: string | null;
    created_at: string;
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
    await supabaseAdmin.rpc("concluir_consultas_vencidas");

    const [
      { data: perfis },
      { data: papeis },
      { data: consultas },
      { data: profissionais },
      { data: livros },
      { data: payouts },
      { data: cfgRows },
      { data: regras },
      { data: repasseDetalhes },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, nome, email, telefone, codigo_anonimo, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("appointments")
        .select(
          "id, inicio, fim, status, payment_status, taxa_agendamento_centavos, valor_consulta_centavos, valor_plataforma_centavos, valor_profissional_centavos, patient_id, professional_id, video_url, professionals(nome)",
        )
        .order("inicio", { ascending: false })
        .limit(500),
      supabaseAdmin.from("professionals").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("livro_compras").select("user_id, status, clicado_em, comprado_em"),
      supabaseAdmin
        .from("payouts")
        .select(
          "id, professional_id, appointment_id, valor_centavos, valor_bruto_centavos, valor_plataforma_centavos, status, previsto_para, pago_em, observacao, professionals(nome)",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("platform_settings").select("chave, valor"),
      supabaseAdmin.from("availability_rules").select("professional_id"),
      supabaseAdmin.from("professional_payout_details").select("professional_id, chave_pix"),
    ]);

    const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.nome ?? p.email ?? "—"]));
    const emailPorId = new Map((perfis ?? []).map((p) => [p.id, p.email]));
    const papeisPorId = new Map<string, string[]>();
    for (const p of papeis ?? []) {
      papeisPorId.set(p.user_id, [...(papeisPorId.get(p.user_id) ?? []), p.role as string]);
    }
    const livroPorUser = new Map((livros ?? []).map((l) => [l.user_id, l]));
    const comAgenda = new Set((regras ?? []).map((r) => r.professional_id));
    const pixPorProf = new Map((repasseDetalhes ?? []).map((r) => [r.professional_id, r.chave_pix]));

    const consultasPorPaciente = new Map<string, { total: number; realizadas: number; pago: number }>();
    const consultasPorProfissional = new Map<string, { total: number; realizadas: number }>();
    for (const c of consultas ?? []) {
      const p = consultasPorPaciente.get(c.patient_id) ?? { total: 0, realizadas: 0, pago: 0 };
      p.total += 1;
      if (c.status === "realizada") p.realizadas += 1;
      if (c.payment_status === "aprovado") p.pago += c.taxa_agendamento_centavos ?? 0;
      consultasPorPaciente.set(c.patient_id, p);
      const q = consultasPorProfissional.get(c.professional_id) ?? { total: 0, realizadas: 0 };
      q.total += 1;
      if (c.status === "realizada") q.realizadas += 1;
      consultasPorProfissional.set(c.professional_id, q);
    }

    const pacientes: PacienteAdmin[] = (perfis ?? []).map((p) => {
      const livro = livroPorUser.get(p.id);
      const stats = consultasPorPaciente.get(p.id);
      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        telefone: p.telefone,
        codigo: p.codigo_anonimo,
        criadoEm: p.created_at,
        papeis: papeisPorId.get(p.id) ?? ["paciente"],
        cadastroCompleto: Boolean(p.nome),
        consultas: stats?.total ?? 0,
        consultasRealizadas: stats?.realizadas ?? 0,
        pagoCentavos: stats?.pago ?? 0,
        livroStatus: (livro?.status ?? "nao_comprado") as PacienteAdmin["livroStatus"],
        livroClicadoEm: livro?.clicado_em ?? null,
        livroCompradoEm: livro?.comprado_em ?? null,
      };
    });

    const listaConsultas: ConsultaAdmin[] = (consultas ?? []).map((c) => ({
      id: c.id,
      inicio: c.inicio,
      fim: c.fim,
      status: c.status as string,
      payment_status: c.payment_status as string,
      taxa_centavos: c.taxa_agendamento_centavos ?? 0,
      valor_consulta_centavos: c.valor_consulta_centavos ?? 0,
      valor_plataforma_centavos: c.valor_plataforma_centavos ?? 0,
      valor_profissional_centavos: c.valor_profissional_centavos ?? 0,
      paciente: nomePorId.get(c.patient_id) ?? "—",
      profissional: (c.professionals as { nome?: string } | null)?.nome ?? "—",
      video_url: c.video_url,
    }));

    const inicioPorConsulta = new Map((consultas ?? []).map((c) => [c.id, c.inicio]));
    const repasses: RepasseAdmin[] = (payouts ?? []).map((p) => ({
      id: p.id,
      profissional: (p.professionals as { nome?: string } | null)?.nome ?? "—",
      professional_id: p.professional_id,
      consultaInicio: p.appointment_id ? (inicioPorConsulta.get(p.appointment_id) ?? null) : null,
      bruto: p.valor_bruto_centavos ?? 0,
      plataforma: p.valor_plataforma_centavos ?? 0,
      liquido: p.valor_centavos,
      status: p.status as string,
      previstoPara: p.previsto_para,
      pagoEm: p.pago_em,
      observacao: p.observacao,
      chavePix: pixPorProf.get(p.professional_id) ?? null,
    }));

    const idsProfissionais = (profissionais ?? []).map((p) => p.id);
    const [{ data: documentos }, { data: historico }] = idsProfissionais.length
      ? await Promise.all([
          supabaseAdmin
            .from("professional_documents")
            .select("id, professional_id, tipo, nome_arquivo, caminho, status, observacao_admin, created_at")
            .in("professional_id", idsProfissionais)
            .order("created_at", { ascending: false }),
          supabaseAdmin
            .from("professional_status_history")
            .select("id, professional_id, status_anterior, status_novo, requer_correcao, observacao, created_at")
            .in("professional_id", idsProfissionais)
            .order("created_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

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
        observacao_admin: doc.observacao_admin,
        created_at: doc.created_at,
        url: assinado?.signedUrl ?? null,
      });
      docsPorProfissional.set(doc.professional_id, lista);
    }
    const histPorProfissional = new Map<string, ProfissionalAdmin["historico"]>();
    for (const h of historico ?? []) {
      const lista = histPorProfissional.get(h.professional_id) ?? [];
      lista.push(h);
      histPorProfissional.set(h.professional_id, lista);
    }

    const listaProfissionais: ProfissionalAdmin[] = (profissionais ?? []).map((p) => {
      const docs = docsPorProfissional.get(p.id) ?? [];
      const stats = consultasPorProfissional.get(p.id);
      return {
        id: p.id,
        user_id: p.user_id,
        nome: p.nome,
        slug: p.slug,
        profissao: p.profissao as string,
        registro: p.registro,
        uf: p.uf,
        cidade: p.cidade,
        status: p.status as string,
        requer_correcao: Boolean(p.requer_correcao),
        etapa: calcularEtapa(p, docs, comAgenda.has(p.id)),
        valor_centavos: p.valor_centavos,
        comissao_percent: Number(p.comissao_percent ?? 20),
        consultas: stats?.total ?? 0,
        consultasRealizadas: stats?.realizadas ?? 0,
        telefone: p.telefone,
        email_contato: p.email_contato,
        email_login: p.user_id ? (emailPorId.get(p.user_id) ?? null) : null,
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
        rqe: p.rqe,
        ferramenta_provedor: p.ferramenta_provedor,
        ferramenta_url_sala: p.ferramenta_url_sala,
        certidao_validade: p.certidao_validade,
        apolice_validade: p.apolice_validade,
        temAgenda: comAgenda.has(p.id),
        criadoEm: p.created_at,
        documentos: docs,
        historico: histPorProfissional.get(p.id) ?? [],
      };
    });

    const agora = Date.now();
    const realizadas = listaConsultas.filter((c) => c.status === "realizada");
    const totais = {
      pacientes: pacientes.filter((p) => !(p.papeis.includes("profissional") || p.papeis.includes("admin"))).length,
      profissionais: listaProfissionais.length,
      profissionaisAtivos: listaProfissionais.filter((p) => p.status === "aprovado").length,
      pendentes: listaProfissionais.filter((p) => p.status === "pendente").length,
      consultasFuturas: listaConsultas.filter(
        (c) => new Date(c.inicio).getTime() > agora && (c.status === "confirmada" || c.status === "aguardando_pagamento"),
      ).length,
      consultasRealizadas: realizadas.length,
      receitaTaxasCentavos: listaConsultas
        .filter((c) => c.payment_status === "aprovado")
        .reduce((s, c) => s + c.taxa_centavos, 0),
      receitaComissaoCentavos: realizadas.reduce((s, c) => s + c.valor_plataforma_centavos, 0),
      aPagarProfissionaisCentavos: repasses
        .filter((r) => r.status === "pendente" || r.status === "processando")
        .reduce((s, r) => s + r.liquido, 0),
      pagoProfissionaisCentavos: repasses
        .filter((r) => r.status === "pago")
        .reduce((s, r) => s + r.liquido, 0),
      livrosConfirmados: pacientes.filter((p) => p.livroStatus === "confirmada").length,
      livrosPendentes: pacientes.filter((p) => p.livroStatus === "pendente").length,
    };

    return {
      pacientes,
      consultas: listaConsultas,
      profissionais: listaProfissionais,
      repasses,
      configuracoes: mapearConfiguracoes(cfgRows),
      totais,
    };
  });

export const definirStatusProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id: string;
      status: "pendente" | "aprovado" | "suspenso" | "rejeitado";
      observacao?: string;
      requerCorrecao?: boolean;
    }) => ({
      id: String(data.id),
      status: data.status,
      observacao: data.observacao ? String(data.observacao).trim().slice(0, 1000) : null,
      requerCorrecao: Boolean(data.requerCorrecao),
    }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.status === "aprovado") {
      const { data: prof } = await supabaseAdmin
        .from("professionals")
        .select("ferramenta_url_sala, certidao_validade, apolice_validade")
        .eq("id", data.id)
        .maybeSingle();
      const hoje = new Date().toISOString().slice(0, 10);
      if (!prof?.ferramenta_url_sala) {
        return {
          ok: false as const,
          erro: "O profissional ainda não cadastrou a ferramenta de videochamada. O perfil não pode ser publicado.",
        };
      }
      if (prof.certidao_validade && prof.certidao_validade < hoje) {
        return { ok: false as const, erro: "A certidão do conselho está vencida." };
      }
      if (prof.apolice_validade && prof.apolice_validade < hoje) {
        return { ok: false as const, erro: "A apólice de seguro está vencida." };
      }
    }

    const { error } = await supabaseAdmin
      .from("professionals")
      .update({
        status: data.status,
        requer_correcao: data.status === "pendente" ? data.requerCorrecao : false,
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
      comissao_percent?: number;
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
        comissao_percent: Math.min(Math.max(Number(data.comissao_percent ?? 20) || 20, 0), 100),
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

export const definirStatusConsultaAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id: string;
      status: "confirmada" | "realizada" | "cancelada" | "nao_compareceu" | "aguardando_pagamento";
    }) => ({ id: String(data.id), status: data.status }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const extra =
      data.status === "cancelada"
        ? { cancelada_em: new Date().toISOString(), cancelada_por: "gestor" }
        : {};
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ status: data.status, ...extra })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar." };
    return { ok: true as const };
  });

export const definirStatusRepasse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id: string;
      status: "pendente" | "processando" | "pago" | "falhou";
      observacao?: string;
    }) => ({
      id: String(data.id),
      status: data.status,
      observacao: data.observacao ? String(data.observacao).trim().slice(0, 300) : null,
    }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payouts")
      .update({
        status: data.status,
        observacao: data.observacao,
        pago_em: data.status === "pago" ? new Date().toISOString() : null,
        pago_por: data.status === "pago" ? context.userId : null,
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar o repasse." };
    return { ok: true as const };
  });

export const definirStatusLivro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; status: "nao_comprado" | "pendente" | "confirmada" | "cancelada" }) => ({
      userId: String(data.userId),
      status: data.status,
    }),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    const { data: atual } = await supabaseAdmin
      .from("livro_compras")
      .select("id")
      .eq("user_id", data.userId)
      .maybeSingle();
    const registro = {
      ...(atual ? { id: atual.id } : {}),
      user_id: data.userId,
      email: perfil?.email ?? null,
      status: data.status,
      comprado_em: data.status === "confirmada" ? new Date().toISOString() : null,
      origem: "manual",
    };
    const { error } = await supabaseAdmin.from("livro_compras").upsert(registro, { onConflict: "id" });
    if (error) return { ok: false as const, erro: "Não foi possível atualizar." };
    return { ok: true as const };
  });

export const salvarConfiguracoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Partial<ConfiguracoesPlataforma>) => ({
    taxaCentavos: Math.max(0, Math.round(Number(data.taxaCentavos ?? 5000) || 0)),
    comissaoPercent: Math.min(100, Math.max(0, Number(data.comissaoPercent ?? 20) || 0)),
    duracaoPadraoMinutos: Math.min(180, Math.max(15, Number(data.duracaoPadraoMinutos ?? 50) || 50)),
    cancelamentoHoras: Math.max(0, Number(data.cancelamentoHoras ?? 24) || 0),
    remarcacaoHoras: Math.max(0, Number(data.remarcacaoHoras ?? 24) || 0),
    reembolsoTaxaNoPrazo: Boolean(data.reembolsoTaxaNoPrazo),
    hotmartLivroUrl: String(data.hotmartLivroUrl ?? "").trim().slice(0, 500),
    livroTitulo: String(data.livroTitulo ?? "Como Ser Feliz com TOC").trim().slice(0, 120),
    livroDescontoPercent: Math.min(100, Math.max(0, Number(data.livroDescontoPercent ?? 50) || 0)),
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    if (data.hotmartLivroUrl && !/^https:\/\//.test(data.hotmartLivroUrl)) {
      return { ok: false as const, erro: "O link da Hotmart precisa começar com https://" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const linhas = [
      ["taxa_confirmacao_centavos", data.taxaCentavos],
      ["comissao_plataforma_percent", data.comissaoPercent],
      ["duracao_padrao_minutos", data.duracaoPadraoMinutos],
      ["cancelamento_horas_minimas", data.cancelamentoHoras],
      ["remarcacao_horas_minimas", data.remarcacaoHoras],
      ["reembolso_taxa_no_prazo", data.reembolsoTaxaNoPrazo],
      ["hotmart_livro_url", data.hotmartLivroUrl],
      ["livro_titulo", data.livroTitulo],
      ["livro_desconto_percent", data.livroDescontoPercent],
    ] as const;
    const { error } = await supabaseAdmin.from("platform_settings").upsert(
      linhas.map(([chave, valor]) => ({ chave, valor, updated_at: new Date().toISOString() })),
      { onConflict: "chave" },
    );
    if (error) return { ok: false as const, erro: "Não foi possível salvar as configurações." };
    return { ok: true as const };
  });
