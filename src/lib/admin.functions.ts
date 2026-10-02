import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcularEtapa, type EtapaCadastro } from "@/lib/profissional.functions";
import { mapearConfiguracoes, type ConfiguracoesPlataforma } from "@/lib/plataforma.functions";
import { cpfValido, cnpjValido } from "@/lib/documento-pessoa";
import { primeiraDeteccaoPerfil, ROTULO_ANTICONTATO } from "@/lib/anticontato";
import { ABORDAGENS_PERFIL, IDIOMAS_PERFIL, TEMAS_TOC_PERFIL } from "@/lib/perfil-profissional";
import { TAXA_FIXA_CENTAVOS, valorProfissionalCentavos } from "@/lib/precos";

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

export type PagamentoAdmin = {
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
};

export type ProfissionalAdmin = {
  id: string;
  user_id: string | null;
  nome: string;
  slug: string;
  profissao: string;
  registro: string;
  uf: string;
  cnpj: string | null;
  cpf: string | null;
  tipo_pessoa: string;
  cidade: string | null;
  status: string;
  requer_correcao: boolean;
  etapa: EtapaCadastro;
  valor_centavos: number;
  valor_liquido_centavos: number | null;
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
  foto_status: string;
  foto_observacao: string | null;
  perfil_bloqueios_contato: number;
  abordagens_publicas: string[];
  biografia_publica: string | null;
  temas_toc_publicos: string[];
  formacoes_publicas: Array<{ instituicao: string; curso: string; ano: number }>;
  observacao_admin: string | null;
  validado_em: string | null;
  cadastro_conferido_em: string | null;
  contrato_aceito_em: string | null;
  contrato_versao: string | null;
  ferramenta_provedor: string | null;
  ferramenta_url_sala: string | null;
  certidao_validade: string | null;
  apolice_validade: string | null;
  seguradora_nome: string | null;
  apolice_numero: string | null;
  temAgenda: boolean;
  criadoEm: string;
  documentos: {
    id: string;
    tipo: string;
    nome_arquivo: string;
    status: string;
    observacao_admin: string | null;
    created_at: string;
  }[];
  historico: {
    id: string;
    status_anterior: string | null;
    status_novo: string;
    requer_correcao: boolean;
    observacao: string | null;
    created_at: string;
  }[];
  decisoes: {
    id: string;
    decision: string;
    checklist: Record<string, boolean>;
    reason: string | null;
    decided_at: string;
  }[];
};

async function garantirAdmin(context: { supabase: unknown; userId: string; claims?: unknown }) {
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

function garantirMfa(context: { claims?: unknown }) {
  const aal = (context.claims as { aal?: string } | undefined)?.aal;
  if (aal !== "aal2") throw new Error("A autenticação em duas etapas é obrigatória para abrir documentos privados.");
}

async function registrarAcessoAdmin(userId: string, recurso: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("eventos_auditoria").insert({
    tipo: "acesso_administrativo",
    ator: userId,
    ator_papel: "admin",
    metadados: { recurso },
  });
}

export const painelAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context);
    await registrarAcessoAdmin(context.userId, "painel_admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("concluir_consultas_vencidas");

    const [
      { data: perfis },
      { data: papeis },
      { data: consultas },
      { data: profissionais },
      { data: contatosProfissionais },
      { data: cfgRows },
      { data: regras },
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
       supabaseAdmin.from("professionals").select("*").order("created_at", { ascending: true }),
       supabaseAdmin.from("professional_admin_contacts").select("professional_id, telefone"),
      supabaseAdmin.from("platform_settings").select("chave, valor"),
      supabaseAdmin.from("availability_rules").select("professional_id"),
    ]);

    const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.nome ?? p.email ?? "—"]));
    const emailPorId = new Map((perfis ?? []).map((p) => [p.id, p.email]));
    const telefoneProfissionalPorId = new Map((contatosProfissionais ?? []).map((c) => [c.professional_id, c.telefone]));
    const papeisPorId = new Map<string, string[]>();
    for (const p of papeis ?? []) {
      papeisPorId.set(p.user_id, [...(papeisPorId.get(p.user_id) ?? []), p.role as string]);
    }
    const comAgenda = new Set((regras ?? []).map((r) => r.professional_id));
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

    const pagamentos: PagamentoAdmin[] = listaConsultas
      .filter((c) => c.status === "realizada" || c.status === "nao_compareceu")
      .map((c) => ({
        id: c.id,
        profissional: c.profissional,
        professional_id: String((consultas ?? []).find((row) => row.id === c.id)?.professional_id ?? ""),
        consultaInicio: c.inicio,
        bruto: c.valor_consulta_centavos,
        plataforma: c.valor_plataforma_centavos,
        liquido: c.valor_profissional_centavos,
        status: c.payment_status,
        previstoPara: null,
        pagoEm: c.payment_status === "aprovado" ? c.inicio : null,
        observacao: null,
      }));

    const idsProfissionais = (profissionais ?? []).map((p) => p.id);
    const [{ data: documentos }, { data: historico }, { data: contratos }, { data: decisoes }] = idsProfissionais.length
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
           supabaseAdmin
             .from("document_acceptances")
             .select("professional_id, contract_version, accepted_at")
             .in("professional_id", idsProfissionais)
             .order("accepted_at", { ascending: false }),
          supabaseAdmin
            .from("professional_review_decisions")
            .select("id, professional_id, decision, checklist, reason, decided_at")
            .in("professional_id", idsProfissionais)
            .order("decided_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

    const docsPorProfissional = new Map<string, ProfissionalAdmin["documentos"]>();
    for (const doc of documentos ?? []) {
      const lista = docsPorProfissional.get(doc.professional_id) ?? [];
      lista.push({
        id: doc.id,
        tipo: doc.tipo,
        nome_arquivo: doc.nome_arquivo,
        status: doc.status as string,
        observacao_admin: doc.observacao_admin,
        created_at: doc.created_at,
      });
      docsPorProfissional.set(doc.professional_id, lista);
    }
    const histPorProfissional = new Map<string, ProfissionalAdmin["historico"]>();
    for (const h of historico ?? []) {
      const lista = histPorProfissional.get(h.professional_id) ?? [];
      lista.push(h);
      histPorProfissional.set(h.professional_id, lista);
    }
     const contratoPorProfissional = new Map<string, { contract_version: string; accepted_at: string }>();
    for (const contrato of contratos ?? []) {
      if (!contratoPorProfissional.has(contrato.professional_id)) {
        contratoPorProfissional.set(contrato.professional_id, contrato);
      }
    }
    const decisoesPorProfissional = new Map<string, ProfissionalAdmin["decisoes"]>();
    for (const decisao of decisoes ?? []) {
      const lista = decisoesPorProfissional.get(decisao.professional_id) ?? [];
      lista.push({ id: decisao.id, decision: decisao.decision, checklist: (decisao.checklist ?? {}) as Record<string, boolean>, reason: decisao.reason, decided_at: decisao.decided_at });
      decisoesPorProfissional.set(decisao.professional_id, lista);
    }

    const listaProfissionais: ProfissionalAdmin[] = [];
    for (const p of profissionais ?? []) {
      const docs = docsPorProfissional.get(p.id) ?? [];
      const stats = consultasPorProfissional.get(p.id);
      const contrato = contratoPorProfissional.get(p.id);
      let fotoUrl: string | null = null;
      if (p.foto_caminho) {
        const { data: foto } = await supabaseAdmin.storage.from("fotos-profissionais").createSignedUrl(p.foto_caminho, 600);
        fotoUrl = foto?.signedUrl ?? null;
      }
      listaProfissionais.push({
        id: p.id,
        user_id: p.user_id,
        nome: p.nome,
        slug: p.slug,
        profissao: p.profissao as string,
        registro: p.registro,
        uf: p.uf,
        cnpj: p.cnpj,
        cpf: p.cpf,
        tipo_pessoa: p.tipo_pessoa ?? (p.cnpj ? "PJ" : "PF"),
        cidade: p.cidade,
        status: p.status as string,
        requer_correcao: Boolean(p.requer_correcao),
         etapa: calcularEtapa(p, docs, comAgenda.has(p.id), Boolean(contrato), false),
        valor_centavos: p.valor_centavos,
        valor_liquido_centavos: p.valor_liquido_centavos,
        consultas: stats?.total ?? 0,
        consultasRealizadas: stats?.realizadas ?? 0,
        telefone: telefoneProfissionalPorId.get(p.id) ?? null,
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
        foto_url: fotoUrl,
        foto_status: p.foto_status,
        foto_observacao: p.foto_observacao,
        perfil_bloqueios_contato: p.perfil_bloqueios_contato,
        abordagens_publicas: p.abordagens_publicas ?? [],
        biografia_publica: p.biografia_publica,
        temas_toc_publicos: p.temas_toc_publicos ?? [],
        formacoes_publicas: (p.formacoes_publicas ?? []) as Array<{ instituicao: string; curso: string; ano: number }>,
        observacao_admin: p.observacao_admin,
        validado_em: p.validado_em,
        cadastro_conferido_em: p.cadastro_conferido_em,
         contrato_aceito_em: contrato?.accepted_at ?? null,
         contrato_versao: contrato?.contract_version ?? null,
        ferramenta_provedor: p.ferramenta_provedor,
        ferramenta_url_sala: p.ferramenta_url_sala,
        certidao_validade: p.certidao_validade,
        apolice_validade: p.apolice_validade,
        seguradora_nome: p.seguradora_nome,
        apolice_numero: p.apolice_numero,
        temAgenda: comAgenda.has(p.id),
        criadoEm: p.created_at,
        documentos: docs,
        historico: histPorProfissional.get(p.id) ?? [],
        decisoes: decisoesPorProfissional.get(p.id) ?? [],
      });
    }

    const agora = Date.now();
    const realizadas = listaConsultas.filter((c) => c.status === "realizada");
    const profissionaisNaPlataforma = listaProfissionais.filter((p) => p.status !== "descredenciado");
    const totais = {
      pacientes: pacientes.filter((p) => !(p.papeis.includes("profissional") || p.papeis.includes("admin"))).length,
      profissionais: profissionaisNaPlataforma.length,
      profissionaisAtivos: profissionaisNaPlataforma.filter((p) => p.status === "aprovado").length,
      pendentes: profissionaisNaPlataforma.filter((p) => p.status === "pendente").length,
      perfisSinalizados: profissionaisNaPlataforma.filter((p) => p.perfil_bloqueios_contato > 2).length,
      consultasFuturas: listaConsultas.filter(
        (c) => new Date(c.inicio).getTime() > agora && (c.status === "confirmada" || c.status === "aguardando_pagamento"),
      ).length,
      consultasRealizadas: realizadas.length,
      taxasRegistradasCentavos: listaConsultas
        .filter((c) => c.payment_status === "aprovado")
        .reduce((s, c) => s + c.taxa_centavos, 0),
      taxasRealizadasCentavos: realizadas.reduce((s, c) => s + c.valor_plataforma_centavos, 0),
      valorConsultasPendentesCentavos: pagamentos
        .filter((r) => r.status !== "aprovado")
        .reduce((s, r) => s + r.liquido, 0),
      valorConsultasAprovadasCentavos: pagamentos
        .filter((r) => r.status === "aprovado")
        .reduce((s, r) => s + r.liquido, 0),
    };

    return {
      pacientes,
      consultas: listaConsultas,
      profissionais: listaProfissionais,
      pagamentos,
      configuracoes: mapearConfiguracoes(cfgRows),
      totais,
    };
  });

export type LinhaRelatorio = {
  professional_id: string;
  nome: string;
  realizadas: number;
  canceladas_paciente: number;
  canceladas_profissional: number;
  nao_comparecimentos: number;
  expiradas: number;
  taxas_centavos: number;
};

/** Relatório de metadados administrativos (nunca conteúdo de atendimento). */
export const relatorioMetadados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { de?: string; ate?: string }) => ({
    de: data?.de ? String(data.de) : null,
    ate: data?.ate ? String(data.ate) : null,
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    await registrarAcessoAdmin(context.userId, "relatorio_metadados");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.rpc("concluir_consultas_vencidas");
    const agora = new Date();
    const de = data.de ? new Date(data.de) : new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
    const ate = data.ate ? new Date(data.ate) : new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    const { data: linhas } = await supabaseAdmin.rpc("relatorio_metadados", {
      _de: de.toISOString(),
      _ate: ate.toISOString(),
    });
    const { data: eventos } = await supabaseAdmin
      .from("eventos_auditoria")
      .select("id, tipo, appointment_id, ator_papel, ocorrido_em")
      .gte("ocorrido_em", de.toISOString())
      .order("ocorrido_em", { ascending: false })
      .limit(120);
    return {
      periodo: { de: de.toISOString(), ate: ate.toISOString() },
      linhas: (linhas ?? []) as LinhaRelatorio[],
      eventos: eventos ?? [],
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

    const { data: estadoAtual } = await supabaseAdmin.from("professionals").select("status").eq("id", data.id).maybeSingle();
    if (!estadoAtual || estadoAtual.status === "descredenciado") {
      return { ok: false as const, erro: "Este profissional não está mais na lista ativa." };
    }
    if ((data.status === "rejeitado" || data.requerCorrecao) && !data.observacao) {
      return { ok: false as const, erro: "Informe o motivo antes de continuar." };
    }
    if (data.status === "rejeitado" || data.requerCorrecao) {
      const { error: decisionError } = await supabaseAdmin.rpc("record_professional_review_decision", {
        _professional_id: data.id,
        _decided_by: context.userId,
        _decision: data.status === "rejeitado" ? "rejected" : "correction_requested",
        _checklist: {},
        _reason: data.observacao ?? "",
      });
       if (decisionError) return { ok: false as const, erro: "Não foi possível registrar a decisão." };
       try {
         const { data: perfil } = await supabaseAdmin.from("professionals").select("nome, user_id").eq("id", data.id).single();
         if (perfil?.user_id) {
           const { data: conta } = await supabaseAdmin.auth.admin.getUserById(perfil.user_id);
           if (conta.user?.email) {
             const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
             await sendTemplateEmail("cadastro-profissional-status", conta.user.email, { templateData: { nome: perfil.nome, situacao: data.status === "rejeitado" ? "rejeitado" : "recebido", motivo: data.observacao }, idempotencyKey: `cadastro-${data.status}-${data.id}-${Date.now()}` });
           }
         }
       } catch (error) { console.error("Falha ao notificar revisão profissional", { id: data.id, error }); }
      const { writeAuditEvent } = await import("@/lib/audit.server");
      await writeAuditEvent({ actorId: context.userId, actorRole: "admin", action: "professional_registration_reviewed", entity: "professional", entityId: data.id, metadata: { status: data.status, correction_required: data.requerCorrecao } });
      return { ok: true as const };
    }

    if (data.status === "aprovado") {
      const [{ data: prof }, { data: perfilPronto }] = await Promise.all([
         supabaseAdmin.from("professionals").select("cpf, cnpj, tipo_pessoa, ferramenta_url_sala, certidao_validade").eq("id", data.id).maybeSingle(),
        supabaseAdmin.rpc("perfil_pronto_para_publicar", { _professional_id: data.id }),
      ]);
      const hoje = new Date().toISOString().slice(0, 10);
       if (!prof || !cpfValido(prof.cpf ?? "") || (prof.tipo_pessoa === "PJ" && !cnpjValido(prof.cnpj ?? ""))) {
         return { ok: false as const, erro: "Confira o CPF e, para pessoa jurídica, o CNPJ do profissional." };
      }
      if (!prof?.ferramenta_url_sala) {
        return {
          ok: false as const,
          erro: "O profissional ainda não cadastrou a ferramenta de videochamada. O perfil não pode ser publicado.",
        };
      }
      if (!perfilPronto) return { ok: false as const, erro: "O perfil público ainda está incompleto ou a foto não foi aprovada." };
      if (prof.certidao_validade && prof.certidao_validade < hoje) {
        return { ok: false as const, erro: "A certidão do conselho está vencida." };
      }
      const { data: documentosObrigatorios } = await supabaseAdmin
        .from("professional_documents")
        .select("tipo, status")
        .eq("professional_id", data.id)
        .eq("status", "aprovado");
      const tiposAprovados = new Set((documentosObrigatorios ?? []).map((doc) => doc.tipo));
      if (!tiposAprovados.has("Carteirinha profissional do CRP") || !tiposAprovados.has("Diploma de graduação")) {
        return { ok: false as const, erro: "A carteirinha do CRP e o diploma precisam estar aprovados." };
      }
      const { data: contratoAceito } = await supabaseAdmin.rpc("professional_contract_ready", {
        _professional_id: data.id,
      });
      if (!contratoAceito) {
        return { ok: false as const, erro: "O profissional ainda não aceitou a versão ativa do contrato." };
      }
      const [{ data: conta }, { data: agenda }] = await Promise.all([
        supabaseAdmin.from("asaas_professional_accounts").select("wallet_id, status").eq("professional_id", data.id).eq("status", "ativa").maybeSingle(),
        supabaseAdmin.from("availability_rules").select("id").eq("professional_id", data.id).limit(1),
      ]);
      if (!conta?.wallet_id) return { ok: false as const, erro: "A conta de recebimento ainda não está ativa." };
      if (!agenda?.length) return { ok: false as const, erro: "O profissional ainda não configurou a agenda." };
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
    try {
      const { data: perfil } = await supabaseAdmin.from("professionals").select("nome, user_id").eq("id", data.id).single();
      if (perfil?.user_id) {
        const { data: conta } = await supabaseAdmin.auth.admin.getUserById(perfil.user_id);
        if (conta.user?.email) {
          const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
          await sendTemplateEmail("cadastro-profissional-status", conta.user.email, { templateData: { nome: perfil.nome, situacao: data.status === "suspenso" ? "suspenso" : "aprovado" }, idempotencyKey: `cadastro-${data.status}-${data.id}-${Date.now()}` });
        }
      }
    } catch (error) { console.error("Falha ao notificar status profissional", { id: data.id, error }); }
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({
      actorId: context.userId,
      actorRole: "admin",
      action: "professional_registration_reviewed",
      entity: "professional",
      entityId: data.id,
      metadata: { status: data.status, correction_required: data.requerCorrecao },
    });
    return { ok: true as const };
  });

export const excluirProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profissional, error: buscaErro } = await supabaseAdmin
      .from("professionals")
      .select("id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (buscaErro) return { ok: false as const, erro: "Não foi possível conferir o cadastro." };
    if (!profissional || profissional.status === "descredenciado") {
      return { ok: false as const, erro: "Este profissional não está mais na lista ativa." };
    }
    const { count, error: consultasErro } = await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", data.id)
      .in("status", ["aguardando_pagamento", "confirmada"])
      .gte("fim", new Date().toISOString());
    if (consultasErro) return { ok: false as const, erro: "Não foi possível conferir as consultas deste profissional." };
    if (count) return { ok: false as const, erro: "Há consultas futuras em aberto. Resolva esses agendamentos antes de excluir o profissional." };

    // A remoção física apagaria documentos e vínculos em cascata; o estado
    // descredenciado remove o perfil público sem destruir evidências legais.
    const { data: alterado, error } = await supabaseAdmin
      .from("professionals")
      .update({ status: "descredenciado", requer_correcao: false })
      .eq("id", data.id)
      .neq("status", "descredenciado")
      .select("id")
      .maybeSingle();
    if (error || !alterado) return { ok: false as const, erro: "Não foi possível excluir o profissional da lista." };
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: "admin", action: "professional_registration_reviewed", entity: "professional", entityId: data.id, metadata: { status: "descredenciado" } });
    return { ok: true as const };
  });

const checklistConferenciaSchema = {
  identity_matches: false,
  crp_active: false,
  certificate_valid: false,
  diploma_matches: false,
  annex_v_compliant: false,
};

export const conferirCadastroProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; checklist: Record<keyof typeof checklistConferenciaSchema, boolean> }) => ({
    id: String(data.id),
    checklist: Object.fromEntries(Object.keys(checklistConferenciaSchema).map((key) => [key, data.checklist?.[key as keyof typeof checklistConferenciaSchema] === true])) as Record<keyof typeof checklistConferenciaSchema, boolean>,
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: prof }, { data: perfilPronto }, { data: documentos }] = await Promise.all([
       supabaseAdmin.from("professionals").select("cpf, cnpj, tipo_pessoa, ferramenta_url_sala, certidao_validade, status").eq("id", data.id).maybeSingle(),
      supabaseAdmin.rpc("perfil_pronto_para_publicar", { _professional_id: data.id }),
      supabaseAdmin.from("professional_documents").select("tipo, status").eq("professional_id", data.id).eq("status", "aprovado"),
    ]);
    const hoje = new Date().toISOString().slice(0, 10);
    if (!prof || prof.status === "descredenciado") return { ok: false as const, erro: "Este profissional não está mais na lista ativa." };
    const tipos = new Set((documentos ?? []).map((doc) => doc.tipo));
    if (!Object.values(data.checklist).every(Boolean)) return { ok: false as const, erro: "Marque todos os itens da conferência antes de aprovar." };
    if (!cpfValido(prof.cpf ?? "") || (prof.tipo_pessoa === "PJ" && !cnpjValido(prof.cnpj ?? ""))) return { ok: false as const, erro: "Confira o CPF e, para pessoa jurídica, o CNPJ do profissional." };
    if (!prof.ferramenta_url_sala) return { ok: false as const, erro: "A ferramenta de videochamada ainda não foi cadastrada." };
    if (!perfilPronto) return { ok: false as const, erro: "O perfil público ainda está incompleto ou a foto não foi aprovada." };
    if (prof.certidao_validade && prof.certidao_validade < hoje) return { ok: false as const, erro: "A certidão do conselho está vencida." };
    if (!tipos.has("Carteirinha profissional do CRP") || !tipos.has("Diploma de graduação")) {
      return { ok: false as const, erro: "A carteirinha do CRP e o diploma precisam estar aprovados." };
    }
    const { error: decisionError } = await supabaseAdmin.rpc("record_professional_review_decision", { _professional_id: data.id, _decided_by: context.userId, _decision: "approved", _checklist: data.checklist, _reason: "" });
    if (decisionError) return { ok: false as const, erro: "Não foi possível registrar a decisão de aprovação." };
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: "admin", action: "professional_registration_reviewed", entity: "professional", entityId: data.id, metadata: { status: "checked" } });
    try {
      const { data: perfil } = await supabaseAdmin.from("professionals").select("nome, user_id").eq("id", data.id).single();
      if (perfil?.user_id) {
        const { data: conta } = await supabaseAdmin.auth.admin.getUserById(perfil.user_id);
        if (conta.user?.email) {
          const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
          await sendTemplateEmail("cadastro-profissional-status", conta.user.email, { templateData: { nome: perfil.nome, situacao: "aprovado" }, idempotencyKey: `cadastro-conferido-${data.id}` });
        }
      }
    } catch (error) { console.error("Falha ao avisar aprovação profissional", { id: data.id, error }); }
    return { ok: true as const };
  });

export const obterDocumentoCredenciamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    if ((context.claims as { aal?: string } | undefined)?.aal !== "aal2") {
      return { ok: false as const, erro: "Proteja esta sessão com o código do aplicativo autenticador para abrir documentos privados." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: documento } = await supabaseAdmin
      .from("professional_documents")
      .select("id, professional_id, caminho")
      .eq("id", data.id)
      .maybeSingle();
    if (!documento) return { ok: false as const, erro: "Documento não encontrado." };
    const { data: arquivo } = await supabaseAdmin.storage.from("documentos-profissionais").createSignedUrl(documento.caminho, 60);
    if (!arquivo?.signedUrl) return { ok: false as const, erro: "Não foi possível abrir o documento." };
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: "admin", action: "credential_document_accessed", entity: "professional_document", entityId: documento.id, metadata: { professional_id: documento.professional_id } });
    return { ok: true as const, url: arquivo.signedUrl, expiresInSeconds: 60 };
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

export const definirStatusFoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "aprovada" | "recusada"; observacao?: string }) => ({
    id: String(data.id),
    status: data.status,
    observacao: String(data.observacao ?? "").trim().slice(0, 500) || null,
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profissional } = await supabaseAdmin
      .from("professionals")
      .select("foto_caminho")
      .eq("id", data.id)
      .maybeSingle();
    if (!profissional?.foto_caminho) return { ok: false as const, erro: "Nenhuma foto foi enviada." };
    const { error } = await supabaseAdmin.from("professionals").update({
      foto_status: data.status,
      foto_moderada_em: new Date().toISOString(),
      foto_moderada_por: context.userId,
      foto_observacao: data.observacao,
      ...(data.status === "recusada" ? { status: "pendente" as const } : {}),
    }).eq("id", data.id);
    if (error) return { ok: false as const, erro: "Não foi possível atualizar a foto." };
    await supabaseAdmin.from("eventos_auditoria").insert({
      tipo: "moderacao_foto_perfil",
      professional_id: data.id,
      ator: context.userId,
      ator_papel: "admin",
      metadados: { status: data.status },
    });
    return { ok: true as const };
  });

export const editarProfissionalAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id: string;
      nome: string;
      tipo_pessoa: "PF" | "PJ";
      cpf: string;
      cnpj?: string;
      telefone: string;
      registro: string;
      uf: string;
      valor_centavos: number;
      experiencia_anos: number;
      abordagens_publicas: string;
      formacoes_publicas: string;
      temas_toc_publicos: string;
      biografia_publica: string;
      areas: string;
      idiomas: string;
      ferramenta_provedor: string;
      ferramenta_url_sala: string;
      ferramenta_instrucoes: string;
    }) => {
      const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
      const lista = (v: unknown, limite = 30) =>
        String(v ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, limite);
      const nome = texto(data.nome, 120);
      const registro = texto(data.registro, 40);
      const uf = texto(data.uf, 2).toUpperCase();
      const cpf = String(data.cpf ?? "").replace(/\D/g, "");
      const cnpj = String(data.cnpj ?? "").replace(/\D/g, "");
      const telefone = String(data.telefone ?? "").replace(/\D/g, "");
      const tipoPessoa = data.tipo_pessoa === "PJ" ? "PJ" : "PF";
      const valorCentavos = Math.min(Math.max(Math.round(Number(data.valor_centavos) || 0), 0), 500000);
      if (nome.length < 3) throw new Error("Informe o nome completo da profissional.");
      if (!cpfValido(cpf)) throw new Error("Informe um CPF válido.");
      if (tipoPessoa === "PJ" && !cnpjValido(cnpj)) throw new Error("Informe um CNPJ válido.");
      if (telefone.length < 10 || telefone.length > 11) throw new Error("Informe um telefone válido com DDD.");
      if (registro.length < 3) throw new Error("Informe o registro profissional (CRP).");
      if (uf.length !== 2) throw new Error("Informe a UF do registro.");
      if (valorCentavos <= TAXA_FIXA_CENTAVOS) throw new Error("O valor da consulta precisa ser maior que R$ 27,00.");
      const abordagens = lista(data.abordagens_publicas, 3).filter((item) => (ABORDAGENS_PERFIL as readonly string[]).includes(item));
      const temas = lista(data.temas_toc_publicos).filter((item) => (TEMAS_TOC_PERFIL as readonly string[]).includes(item));
      const idiomas = lista(data.idiomas).filter((item) => (IDIOMAS_PERFIL as readonly string[]).includes(item));
      const formacoes = texto(data.formacoes_publicas, 3000).split("\n").map((linha) => {
        const [curso = "", instituicao = "", anoTexto = ""] = linha.split("|").map((item) => item.trim());
        return { curso: curso.slice(0, 160), instituicao: instituicao.slice(0, 160), ano: Math.round(Number(anoTexto)) };
      }).filter((item) => item.curso && item.instituicao && item.ano >= 1900 && item.ano <= new Date().getFullYear()).slice(0, 12);
      const biografia = texto(data.biografia_publica, 600);
      const areas = lista(data.areas);
      const instrucoes = texto(data.ferramenta_instrucoes, 1000);
      const deteccao = primeiraDeteccaoPerfil([biografia, ...abordagens, ...temas, ...formacoes.flatMap((item) => [item.curso, item.instituicao]), ...areas, ...idiomas, instrucoes]);
      if (deteccao) throw new Error(`Remova ${ROTULO_ANTICONTATO[deteccao.tipo]} das informações públicas: “${deteccao.trecho}”.`);
      const sala = texto(data.ferramenta_url_sala, 500);
      if (sala) {
        try {
          const url = new URL(sala);
          if (url.protocol !== "https:") throw new Error();
        } catch {
          throw new Error("Informe um endereço HTTPS válido para a sala virtual.");
        }
      }
      return {
        id: String(data.id),
        nome,
        tipo_pessoa: tipoPessoa,
        cpf,
        cnpj: tipoPessoa === "PJ" ? cnpj : null,
        telefone,
        registro,
        uf,
        valor_centavos: valorCentavos,
        valor_liquido_centavos: valorProfissionalCentavos(valorCentavos),
        experiencia_anos: Math.min(Math.max(Number(data.experiencia_anos ?? 0) || 0, 0), 70),
        abordagens_publicas: abordagens,
        formacoes_publicas: formacoes,
        temas_toc_publicos: temas,
        biografia_publica: biografia || null,
        areas,
        idiomas,
        ferramenta_provedor: texto(data.ferramenta_provedor, 80) || null,
        ferramenta_url_sala: sala || null,
        ferramenta_instrucoes: instrucoes || null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, telefone, ...dadosCadastro } = data;
    const { data: atual } = await supabaseAdmin.from("professionals").select("status").eq("id", id).maybeSingle();
    if (!atual || atual.status === "descredenciado") return { ok: false as const, erro: "Este profissional não está mais na lista ativa." };
    const { error } = await supabaseAdmin
      .from("professionals")
      .update({
        ...dadosCadastro,
        status: "pendente" as const,
        requer_correcao: false,
      })
      .eq("id", id);
    if (error) return { ok: false as const, erro: "Não foi possível salvar as alterações." };
    const { error: contatoErro } = await supabaseAdmin.from("professional_admin_contacts").upsert({ professional_id: id, telefone });
    if (contatoErro) return { ok: false as const, erro: "Os dados foram salvos, mas o telefone não pôde ser atualizado." };
    if (atual.status !== "pendente") {
      const { error: decisaoErro } = await supabaseAdmin.rpc("record_professional_review_decision", {
        _professional_id: id,
        _decided_by: context.userId,
        _decision: "correction_requested",
        _checklist: {},
        _reason: "Dados ajustados manualmente pela gestão; nova conferência necessária.",
      });
      if (decisaoErro) return { ok: false as const, erro: "Dados salvos, mas não foi possível devolver o cadastro para conferência." };
    }
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({
      actorId: context.userId,
      actorRole: "admin",
      action: "profile_data_changed",
      entity: "professional",
      entityId: id,
      metadata: { fields: [...Object.keys(dadosCadastro), "telefone", "status"] },
    });
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
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: "admin", action: "appointment_status_changed", entity: "appointment", entityId: data.id, metadata: { status: data.status } });
    return { ok: true as const };
  });

export const salvarConfiguracoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Partial<ConfiguracoesPlataforma>) => ({
    taxaPorConsultaCentavos: Math.max(0, Math.round(Number(data.taxaPorConsultaCentavos ?? 2900) || 0)),
    duracaoPadraoMinutos: Math.min(180, Math.max(15, Number(data.duracaoPadraoMinutos ?? 50) || 50)),
    cancelamentoHoras: Math.max(0, Number(data.cancelamentoHoras ?? 24) || 0),
    remarcacaoHoras: Math.max(0, Number(data.remarcacaoHoras ?? 24) || 0),
    reembolsoTaxaNoPrazo: Boolean(data.reembolsoTaxaNoPrazo),
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const linhas = [
      ["taxa_por_consulta_centavos", data.taxaPorConsultaCentavos],
      ["duracao_padrao_minutos", data.duracaoPadraoMinutos],
      ["cancelamento_horas_minimas", data.cancelamentoHoras],
      ["remarcacao_horas_minimas", data.remarcacaoHoras],
      ["reembolso_taxa_no_prazo", data.reembolsoTaxaNoPrazo],
    ] as const;
    const { error } = await supabaseAdmin.from("platform_settings").upsert(
      linhas.map(([chave, valor]) => ({ chave, valor, updated_at: new Date().toISOString() })),
      { onConflict: "chave" },
    );
    if (error) return { ok: false as const, erro: "Não foi possível salvar as configurações." };
    return { ok: true as const };
  });
