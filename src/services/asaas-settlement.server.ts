import { attendanceOutcome, reconcileSettlement, SettlementReview, type SettlementOutcome } from "@/lib/settlement";
import { settlementProvider } from "@/services/settlement-provider.server";

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
    const { data: a, error } = await db.from("appointments").select("id,fim,status,attendance_status,patient_confirmed_at,professional_confirmed_at,attendance_decided_at,valor_centavos,settlement_status").eq("id", appointmentId).single();
    if (error || !a) throw new Error("APPOINTMENT_READ_FAILED");
    if (["REALIZADA", "FALTA_PACIENTE", "FALTA_PROFISSIONAL"].includes(job.outcome) && attendanceOutcome(a) !== job.outcome) throw new SettlementReview("OUTCOME_NOT_FINAL");
    if (a.settlement_status === "EXECUTADO") throw new SettlementReview("ALREADY_SETTLED");
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