import { attendanceOutcome, reconcileSettlement, SettlementReview, type SettlementOutcome } from "@/lib/settlement";
import { settlementProvider } from "@/services/settlement-provider.server";
import {
  NO_SHOW_FEE_CENTAVOS,
  NO_SHOW_PLATAFORMA_CENTAVOS,
  NO_SHOW_PROFISSIONAL_CENTAVOS,
  TAXA_FIXA_CENTAVOS,
} from "@/lib/precos";

export async function processSettlementJob(appointmentId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: claims, error: claimError } = await db.rpc("claim_appointment_settlement", { _id: appointmentId });
  if (claimError) throw new Error("CLAIM_FAILED");
  const job = claims?.[0];
  if (!job?.claim_token) return { ok: true as const, skipped: true };
  const token = job.claim_token;
  async function lease() {
    const { data, error } = await db.from("appointment_settlement_jobs").select("claim_token,locked_until,status").eq("appointment_id", appointmentId).single();
    if (error || data.claim_token !== token || data.status !== "processing" || !data.locked_until || new Date(data.locked_until).getTime() < Date.now() + 60000) throw new Error("LEASE_LOST");
  }
  try {
    const { data: a, error } = await db.from("appointments").select("id,fim,status,attendance_status,patient_confirmed_at,professional_confirmed_at,attendance_decided_at,valor_centavos,taxa_plataforma_centavos,patient_id,asaas_payment_id,asaas_payment_method,settlement_status").eq("id", appointmentId).single();
    if (error || !a) throw new Error("APPOINTMENT_READ_FAILED");
    if (["REALIZADA", "FALTA_PACIENTE", "FALTA_PROFISSIONAL"].includes(job.outcome) && attendanceOutcome(a) !== job.outcome) throw new SettlementReview("OUTCOME_NOT_FINAL");
    if (a.settlement_status === "EXECUTADO") throw new SettlementReview("ALREADY_SETTLED");

    // OPÇÃO 1 — cobrança única: a plataforma já capturou os R$200 no agendamento.
    // Aqui apenas calculamos e registramos quem recebe o quê (repasse manual ao
    // profissional), geramos o crédito do paciente no no-show e devolvemos
    // integralmente quando o profissional falta. Nenhuma transferência automática.
    if (a.asaas_payment_id) {
      const { asaasConfig, refundPayment } = await import("@/services/asaas.server");
      const { environment } = asaasConfig();
      const valor = a.valor_centavos;
      const taxa = a.taxa_plataforma_centavos ?? TAXA_FIXA_CENTAVOS;
      let captured = 0, platform = 0, professional = 0;

      if (job.outcome === "REALIZADA") {
        captured = valor;
        platform = taxa;
        professional = valor - taxa;
      } else if (job.outcome === "FALTA_PACIENTE") {
        await lease();
        captured = NO_SHOW_FEE_CENTAVOS;
        platform = NO_SHOW_PLATAFORMA_CENTAVOS;
        professional = NO_SHOW_PROFISSIONAL_CENTAVOS;
        const credito = valor - NO_SHOW_FEE_CENTAVOS;
        if (credito > 0) {
          const origin = a.asaas_payment_method === "PIX" ? "no_show_pix" : "no_show_cartao";
          const { error: credErr } = await db.from("patient_credits").insert({
            patient_id: a.patient_id,
            appointment_id: a.id,
            environment,
            amount_centavos: credito,
            origin,
            provider_payment_id: a.asaas_payment_id,
            status: "disponivel",
          });
          // 23505 = crédito já gerado numa tentativa anterior (idempotente).
          if (credErr && credErr.code !== "23505") throw new Error("CREDIT_SAVE_FAILED");
        }
      } else if (job.outcome === "FALTA_PROFISSIONAL") {
        await lease();
        await refundPayment(a.asaas_payment_id); // devolução integral ao paciente
        captured = 0;
        platform = 0;
        professional = 0;
      } else {
        throw new SettlementReview("OUTCOME_UNSUPPORTED");
      }

      const { data: finishedOne, error: finishOneError } = await db.rpc("finish_appointment_settlement", {
        _id: appointmentId,
        _claim: token,
        _captured: captured,
        _platform: platform,
        _professional: professional,
      });
      if (finishOneError || !finishedOne) throw new Error("FINISH_FAILED");
      return { ok: true as const, capturedCentavos: captured };
    }

    // LEGADO — modelo A/B de pré-autorização (mantido por compatibilidade).
    const { data: auths, error: authError } = await db.from("asaas_payment_authorizations").select("*").eq("appointment_id", appointmentId).order("portion");
    if (authError || !auths) throw new Error("AUTHORIZATION_READ_FAILED");
    // Appointment processing is production-only and explicitly disabled until launch approval.
    if (auths.some(p => p.environment !== "production")) throw new SettlementReview("REAL_APPOINTMENT_SANDBOX_BLOCKED");
    if (auths.reduce((sum,p) => sum + p.amount_centavos,0) !== a.valor_centavos) throw new SettlementReview("TOTAL_MISMATCH");
    const provider = settlementProvider("production");
    const totals = await reconcileSettlement(auths.map(p => ({ ...p, reference: p.idempotency_key })), job.outcome as SettlementOutcome, {
      ...provider, lease,
      save: async (p,payment) => {
        const { error: saveError } = await db.from("asaas_payment_authorizations").update({ status: payment.status, provider_status: payment.status, ...(["CONFIRMED","RECEIVED"].includes(payment.status) ? { captured_at: new Date().toISOString() } : { canceled_at: new Date().toISOString() }) }).eq("id",p.id);
        if (saveError) throw new Error("PORTION_SAVE_FAILED");
      },
    });
    const { data: finished, error: finishError } = await db.rpc("finish_appointment_settlement", { _id: appointmentId, _claim: token, _captured: totals.captured, _platform: totals.platform, _professional: totals.professional });
    if (finishError || !finished) throw new Error("FINISH_FAILED");
    return { ok: true as const, capturedCentavos: totals.captured };
  } catch (error) {
    const review = error instanceof SettlementReview || job.attempts >= 5;
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const { data: updated, error: saveError } = await db.from("appointment_settlement_jobs").update({ status: review ? "review" : "retry", failure_code: code.slice(0,80), locked_until: null, available_at: new Date(Date.now() + 120000 * job.attempts).toISOString() }).eq("appointment_id", appointmentId).eq("claim_token",token).select("appointment_id");
    if (saveError) throw new Error("RETRY_SAVE_FAILED");
    if (updated?.length) {
      const { error: statusError } = await db.from("appointments").update({ settlement_status: review ? "REVISAO" : "FALHOU" }).eq("id",appointmentId);
      if (statusError) throw new Error("STATUS_SAVE_FAILED");
    }
    return { ok: false as const, erro: "A cobrança está pendente de nova tentativa ou revisão da gestão." };
  }
}

export async function processSettlementQueue() {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  if (process.env["ASAAS_SETTLEMENT_ENABLED"] !== "true") {
    // Do not keep an idle timer running while public payments are intentionally disabled.
    const { error } = await db.from("appointment_settlement_jobs").update({ status: "review", failure_code: "PAYMENTS_DISABLED" }).in("status",["pending","retry"]);
    if (error) throw new Error("DISABLE_SAVE_FAILED");
    await db.rpc("wake_settlement_queue");
    return { processed: 0, disabled: true };
  }
  const { data, error } = await db.from("appointment_settlement_jobs").select("appointment_id").in("status",["pending","retry","processing"]).lte("available_at",new Date().toISOString()).limit(10);
  if (error) throw new Error("QUEUE_READ_FAILED");
  for (const job of data ?? []) await processSettlementJob(job.appointment_id);
  const { error: wakeError } = await db.rpc("wake_settlement_queue");
  if (wakeError) throw new Error("QUEUE_WAKE_FAILED");
  return { processed: data?.length ?? 0, disabled: false };
}

export async function settleAsaasAppointment(appointmentId: string, outcome: SettlementOutcome, _actorId?: string | null, _actorRole?: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { error } = await db.from("appointment_settlement_jobs").upsert({ appointment_id: appointmentId, outcome }, { onConflict: "appointment_id", ignoreDuplicates: true });
  if (error) return { ok: false as const, erro: "Não foi possível registrar a liquidação." };
  const { error: wakeError } = await db.rpc("wake_settlement_queue");
  if (wakeError) return { ok: false as const, erro: "Liquidação registrada; a gestão deve revisar o processamento." };
  return { ok: true as const, skipped: true };
}