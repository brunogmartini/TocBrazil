import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

export const responderPesquisaPosConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    consultaId: uuid,
    resposta: z.enum(["sim", "ainda_nao_sei", "nao"]),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: consulta } = await context.supabase.from("appointments")
      .select("id, patient_id, professional_id, status")
      .eq("id", data.consultaId).maybeSingle();
    if (!consulta || consulta.patient_id !== context.userId || consulta.status !== "realizada") {
      return { ok: false as const, erro: "Pesquisa indisponível para esta consulta." };
    }
    const { error } = await context.supabase.from("post_consultation_surveys").upsert({
      appointment_id: consulta.id,
      patient_id: context.userId,
      professional_id: consulta.professional_id,
      resposta: data.resposta,
      responded_at: new Date().toISOString(),
    }, { onConflict: "appointment_id" });
    return error ? { ok: false as const, erro: "Não foi possível salvar agora." } : { ok: true as const };
  });

export const criarPreferenciaRecorrencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    consultaId: uuid,
    frequencia: z.enum(["semanal", "quinzenal"]),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: consulta } = await context.supabase.from("appointments")
      .select("patient_id, professional_id, inicio")
      .eq("id", data.consultaId).maybeSingle();
    if (!consulta || consulta.patient_id !== context.userId) return { ok: false as const, erro: "Consulta não encontrada." };
    const faixa = new Date(consulta.inicio).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const { error } = await context.supabase.from("appointment_series").insert({
      patient_id: context.userId,
      professional_id: consulta.professional_id,
      frequencia: data.frequencia,
      faixa_horario: faixa,
    });
    return error ? { ok: false as const, erro: "Não foi possível registrar a preferência." } : { ok: true as const };
  });

export const remarcarConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ consultaId: uuid, novoInicio: z.string().datetime() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: consulta } = await context.supabase.from("appointments")
      .select("id, patient_id, professional_id, inicio, duracao_minutos, status")
      .eq("id", data.consultaId).maybeSingle();
    if (!consulta || consulta.patient_id !== context.userId) return { ok: false as const, erro: "Consulta não encontrada." };
    if (!['confirmada','aguardando_pagamento'].includes(consulta.status)) return { ok: false as const, erro: "Esta consulta não pode ser remarcada." };
    if (new Date(consulta.inicio).getTime() - Date.now() < 24 * 3600_000) return { ok: false as const, erro: "A remarcação deve ser feita com pelo menos 24 horas de antecedência." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profissional } = await supabaseAdmin.from("professionals").select("slug").eq("id", consulta.professional_id).single();
    const { data: livres } = await supabaseAdmin.rpc("slots_disponiveis", { _slug: profissional?.slug ?? "", _dias: 90 });
    const slot = (livres ?? []).find((item) => item.inicio === data.novoInicio);
    if (!slot) return { ok: false as const, erro: "Esse horário não está mais disponível." };
    const { error } = await supabaseAdmin.from("appointments").update({ inicio: slot.inicio, fim: slot.fim }).eq("id", consulta.id);
    if (error) return { ok: false as const, erro: "Não foi possível remarcar agora." };
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId, appointment_id: consulta.id, tipo: "consulta_remarcada", canal: "email",
      titulo: "Consulta remarcada", corpo: "O novo horário foi confirmado. Consulte os detalhes na sua área.",
      agendada_para: new Date().toISOString(),
    });
    await supabaseAdmin.from("eventos_auditoria").insert({ tipo: "consulta_remarcada", appointment_id: consulta.id, professional_id: consulta.professional_id, ator: context.userId, ator_papel: "paciente", metadados: { inicio_anterior: consulta.inicio, inicio_novo: slot.inicio } });
    return { ok: true as const };
  });

export const registrarContinuidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ consultaId: uuid, valorCentavos: z.number().int().positive().max(1_000_000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: profissional } = await context.supabase.from("professionals").select("id").eq("user_id", context.userId).maybeSingle();
    if (!profissional) return { ok: false as const, erro: "Acesso exclusivo para profissionais." };
    const { data: consulta } = await context.supabase.from("appointments").select("patient_id, professional_id, status").eq("id", data.consultaId).maybeSingle();
    if (!consulta || consulta.professional_id !== profissional.id || consulta.status !== "realizada") return { ok: false as const, erro: "Consulta não elegível." };
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: anterior } = await context.supabase.from("continuity_requests").select("id").eq("patient_id", consulta.patient_id).eq("professional_id", profissional.id).eq("manifestacao_em", hoje).maybeSingle();
    if (anterior) return { ok: false as const, erro: "Já existe um registro de continuidade para este paciente hoje." };
    const { error } = await context.supabase.from("continuity_requests").insert({ appointment_id: data.consultaId, patient_id: consulta.patient_id, professional_id: profissional.id, manifestacao_em: hoje, iniciativa_paciente: true, valor_centavos: data.valorCentavos });
    return error ? { ok: false as const, erro: "Não foi possível registrar agora." } : { ok: true as const };
  });

export const indicadoresGestao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: papel } = await context.supabase.from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!papel) throw new Response("Não autorizado", { status: 403 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.rpc("indicadores_profissionais");
    return { indicadores: data ?? [] };
  });