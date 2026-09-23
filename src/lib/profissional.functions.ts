import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { primeiraDeteccaoPerfil, ROTULO_ANTICONTATO } from "@/lib/anticontato";
import {
  ABORDAGENS_PERFIL,
  IDIOMAS_PERFIL,
  TEMAS_TOC_PERFIL,
  type FormacaoPublica,
} from "@/lib/perfil-profissional";

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
  profissao: "psicologo";
  cpf?: string;
  registro: string;
  uf: string;
  genero?: string;
  abordagens_publicas?: string[];
  formacoes_publicas?: FormacaoPublica[];
  temas_toc_publicos?: string[];
  biografia_publica?: string;
  foto_caminho?: string | null;
  experiencia_anos?: number;
  slot_minutos?: number;
  valor_centavos?: number;
  certidao_validade?: string | null;
  apolice_validade?: string | null;
  ferramenta_provedor?: string;
  ferramenta_url_sala?: string;
  ferramenta_instrucoes?: string;
  areas?: string[] | string;

  idiomas?: string[] | string;
};

export const meuCadastroProfissional = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    // Telefone e e-mail de contato não são legíveis pelo cliente do usuário; a leitura do
    // próprio cadastro é feita no servidor e sempre restrita ao user_id autenticado.
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
        contrato: null,
        email: (claims as { email?: string }).email ?? null,
      };
    }

    const [
      { data: documentos },
      { data: regras },
      { data: bloqueios },
      { data: contrato },
    ] = await Promise.all([
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
          .from("contratos_profissionais")
          .select("id, versao, nome_assinatura, aceito_em")
          .eq("professional_id", profissional.id)
          .order("aceito_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    let fotoUrlTemporaria: string | null = null;
    if (profissional.foto_caminho) {
      const { data: foto } = await supabase.storage
        .from("fotos-profissionais")
        .createSignedUrl(profissional.foto_caminho, 900);
      fotoUrlTemporaria = foto?.signedUrl ?? null;
    }
    return {
      profissional: { ...profissional, foto_url_temporaria: fotoUrlTemporaria },
      documentos: documentos ?? [],
      regras: regras ?? [],
      bloqueios: bloqueios ?? [],
      contrato: contrato ?? null,
      email: (claims as { email?: string }).email ?? null,
    };
  });

export const salvarCadastroProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CadastroProfissionalEntrada) => {
    const nome = String(data.nome ?? "").trim().slice(0, 120);
    if (nome.length < 3) throw new Error("Informe seu nome completo.");
    const registro = String(data.registro ?? "").trim().slice(0, 40);
    if (registro.length < 3) throw new Error("Informe seu registro profissional (CRP).");
    const uf = String(data.uf ?? "").trim().toUpperCase().slice(0, 2);
    if (uf.length !== 2) throw new Error("Informe a UF do registro.");
    const profissao: "psicologo" = "psicologo";
    const abordagens = lista(data.abordagens_publicas).filter((item) =>
      (ABORDAGENS_PERFIL as readonly string[]).includes(item),
    ).slice(0, 3);
    const temas = lista(data.temas_toc_publicos).filter((item) =>
      (TEMAS_TOC_PERFIL as readonly string[]).includes(item),
    );
    const idiomas = lista(data.idiomas).filter((item) =>
      (IDIOMAS_PERFIL as readonly string[]).includes(item),
    );
    const formacoes = (Array.isArray(data.formacoes_publicas) ? data.formacoes_publicas : [])
      .map((item) => ({
        instituicao: String(item?.instituicao ?? "").trim().slice(0, 160),
        curso: String(item?.curso ?? "").trim().slice(0, 160),
        ano: Math.round(Number(item?.ano ?? 0)),
      }))
      .filter((item) => item.instituicao && item.curso && item.ano >= 1900 && item.ano <= new Date().getFullYear())
      .slice(0, 12);
    return {
      nome,
      registro,
      uf,
      profissao,
      cpf: String(data.cpf ?? "").replace(/\D/g, "").slice(0, 11) || null,
      genero: String(data.genero ?? "").trim().slice(0, 30) || null,
      abordagens_publicas: abordagens,
      formacoes_publicas: formacoes,
      temas_toc_publicos: temas,
      biografia_publica: String(data.biografia_publica ?? "").trim().slice(0, 600) || null,
      foto_caminho: String(data.foto_caminho ?? "").trim().slice(0, 500) || null,
      experiencia_anos: Math.min(Math.max(Number(data.experiencia_anos ?? 0) || 0, 0), 70),
      slot_minutos: [30, 40, 50, 60].includes(Number(data.slot_minutos))
        ? Number(data.slot_minutos)
        : 50,
      // O profissional define o preço da consulta. A plataforma exibe exatamente
      // esse valor ao paciente: nenhuma margem é somada.
      valor_centavos: Math.min(Math.max(Math.round(Number(data.valor_centavos ?? 0) || 0), 0), 500000),
      areas: lista(data.areas),
      idiomas,
      certidao_validade: data.certidao_validade ? String(data.certidao_validade).slice(0, 10) : null,
      apolice_validade: data.apolice_validade ? String(data.apolice_validade).slice(0, 10) : null,
      ferramenta_provedor: String(data.ferramenta_provedor ?? "").trim().slice(0, 80) || null,
      ferramenta_url_sala: String(data.ferramenta_url_sala ?? "").trim().slice(0, 500) || null,
      ferramenta_instrucoes: String(data.ferramenta_instrucoes ?? "").trim().slice(0, 1000) || null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Somente contas da área profissional podem criar ou editar um cadastro.
    const { data: papeis } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const listaPapeis = (papeis ?? []).map((p) => p.role as string);
    if (!listaPapeis.includes("profissional")) {
      return { ok: false as const, erro: "Esta conta não possui acesso profissional." };
    }

    const { data: existente } = await supabase
      .from("professionals")
      .select("id, slug, status, foto_caminho, perfil_bloqueios_contato")
      .eq("user_id", userId)
      .maybeSingle();

    const deteccao = primeiraDeteccaoPerfil([
      data.biografia_publica,
      ...data.abordagens_publicas,
      ...data.temas_toc_publicos,
      ...data.formacoes_publicas.flatMap((item) => [item.instituicao, item.curso]),
      ...data.areas,
      ...data.idiomas,
      data.ferramenta_instrucoes,
    ]);
    if (deteccao) {
      if (existente) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("deteccoes_anticontato").insert({
          professional_id: existente.id,
          appointment_id: null,
          ator_id: userId,
          contexto: "perfil",
          padrao_tipo: deteccao.tipo,
          acao: "bloqueado",
        });
        await supabaseAdmin.from("professionals").update({
          perfil_bloqueios_contato: (existente.perfil_bloqueios_contato ?? 0) + 1,
        }).eq("id", existente.id);
      }
      return {
        ok: false as const,
        erro: `Remova ${ROTULO_ANTICONTATO[deteccao.tipo]} do perfil: “${deteccao.trecho}”.`,
      };
    }

    if (!data.abordagens_publicas.length || !data.formacoes_publicas.length || !data.temas_toc_publicos.length || !data.biografia_publica || !data.idiomas.length || data.valor_centavos <= 0) {
      return { ok: false as const, erro: "Preencha todos os campos obrigatórios do perfil público." };
    }

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

    return { ok: true as const, id: criado.id, slug: criado.slug };
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

    // Contrato: etapa final do cadastro, será adicionado à plataforma mais adiante.

    const { error } = await supabase
      .from("professional_documents")
      .insert({ professional_id: prof.id, ...data });
    if (error) return { ok: false as const, erro: "Não foi possível registrar o documento." };
    return { ok: true as const };
  });

export const assinarContratoProfissional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome_assinatura: string; documento: string }) => {
    const nome = String(data.nome_assinatura ?? "").trim().slice(0, 120);
    if (nome.split(/\s+/).filter(Boolean).length < 2) {
      throw new Error("Digite seu nome completo para assinar.");
    }
    const documento = String(data.documento ?? "").replace(/\D/g, "").slice(0, 20);
    if (documento.length < 11) throw new Error("Informe um CPF válido (11 dígitos).");
    return { nome_assinatura: nome, documento };
  })
  .handler(async () => {
    return { ok: false as const, erro: "O aceite contratual será habilitado em uma etapa futura." };
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
  taxa_plataforma_centavos: number;
  link_acesso: string | null;
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
  const inicialSobrenome = sobrenome?.[0]?.toUpperCase();
  const rotulo = inicialSobrenome ? `${primeiro} ${inicialSobrenome}.` : primeiro;
  return { paciente: rotulo, codigo: perfil.codigo_anonimo, vinculado: true };
}

async function profissionalDoUsuario(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >;
  const { data } = await supabase
    .from("professionals")
    .select("id, nome, slug, status, slot_minutos, valor_centavos, requer_correcao, observacao_admin, graduacao, apresentacao, areas")
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
            "id, inicio, fim, status, payment_status, duracao_minutos, valor_consulta_centavos, taxa_agendamento_centavos, valor_profissional_centavos, valor_plataforma_centavos, taxa_plataforma_centavos, link_acesso, video_url, patient_id",
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

    const { data: perfis } = await supabase.rpc("meus_pacientes_agendados");
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
    const agora = new Date().toISOString();
    const extra =
      data.status === "cancelada"
        ? { cancelada_em: agora, cancelada_por: "profissional" }
        : {
            // A consulta ocorre fora da plataforma: quem confirma fica registrado.
            confirmado_realizado_por: "profissional",
            confirmado_em: agora,
            ...(data.status === "realizada" ? { realizada_em: agora } : {}),
          };
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
    const { registrarEvento } = await import("@/lib/plataforma.functions");
    await registrarEvento({
      tipo: data.status === "cancelada" ? "cancelamento_profissional" : `status_${data.status}`,
      appointmentId: data.id,
      professionalId: prof.id,
      ator: context.userId,
      atorPapel: "profissional",
    });
    return { ok: true as const };
  });

/* A plataforma é de tecnologia: não guarda prontuário, anotação clínica nem
   qualquer dado de saúde do paciente. */

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
  taxaFixaCentavos: number;
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

    const { configuracoesPlataformaServidor } = await import("@/lib/plataforma.functions");
    const cfg = await configuracoesPlataformaServidor();

    const { data: consultas } = await supabase
      .from("appointments")
      .select(
        "id, inicio, status, payment_status, patient_id, valor_consulta_centavos, taxa_plataforma_centavos, valor_plataforma_centavos, valor_profissional_centavos",
      )
      .eq("professional_id", prof.id)
      .order("inicio", { ascending: false })
      .limit(300);

    const { data: perfis } = await supabase.rpc("meus_pacientes_agendados");
    const perfilPorId = new Map(
      (perfis ?? []).map((p) => [p.id, { ...p, nome: p.nome?.trim().split(/\s+/)[0] ?? null }]),
    );
    const lancamentos: LancamentoFinanceiro[] = (consultas ?? []).map((c) => {
      // Taxa da plataforma: valor fixo em reais por consulta, igual para todos.
      const bruto = c.valor_consulta_centavos ?? 0;
      const plataforma = c.taxa_plataforma_centavos ?? cfg.taxaPorConsultaCentavos;
      const liquido = bruto;
      let situacao: LancamentoFinanceiro["situacao"] = "agendada";
      if (c.status === "aguardando_pagamento") situacao = "aguardando_pagamento";
      else if (c.status === "cancelada") situacao = "cancelada";
      else if (c.status === "nao_compareceu") situacao = "nao_compareceu";
      else if (c.status === "realizada") situacao = c.payment_status === "aprovado" ? "pago" : "a_receber";
      const rotulo = rotuloPaciente(perfilPorId.get(c.patient_id), c.patient_id);
      return {
        id: c.id,
        inicio: c.inicio,
        status: c.status,
        paciente: rotulo.paciente,
        codigo: rotulo.codigo,
        bruto,
        taxaAgendamento: plataforma,
        plataforma,
        liquido,
        taxaFixaCentavos: plataforma,
        situacao,
        pagoEm: c.status === "realizada" && c.payment_status === "aprovado" ? c.inicio : null,
        previstoPara: null,
      };
    });

    const soma = (f: (l: LancamentoFinanceiro) => boolean) =>
      lancamentos.filter(f).reduce((s, l) => s + l.liquido, 0);
    const contabiliza = (l: LancamentoFinanceiro) =>
      l.situacao === "a_receber" || l.situacao === "pago" || l.situacao === "nao_compareceu";
    const resumo = {
      futurosBruto: lancamentos.filter((l) => l.situacao === "agendada").reduce((s, l) => s + l.bruto, 0),
      futurosLiquido: soma((l) => l.situacao === "agendada"),
      aReceber: soma((l) => l.situacao === "a_receber"),
      recebido: soma((l) => l.situacao === "pago"),
      taxasAgendamento: lancamentos.filter(contabiliza).reduce((s, l) => s + l.plataforma, 0),
      taxaFixaCentavos: cfg.taxaPorConsultaCentavos,
      consultasRealizadas: lancamentos.filter((l) => l.situacao === "a_receber" || l.situacao === "pago").length,
      consultasAgendadas: lancamentos.filter((l) => l.situacao === "agendada").length,
    };

    return { profissional: prof, lancamentos, resumo };
  });
