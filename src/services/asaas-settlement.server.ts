import type { Database } from "@/integrations/supabase/types";
import { captureAuthorizedPayment, cancelAuthorizedPayment, refundPayment } from "@/services/asaas.server";

type Outcome = "REALIZADA" | "FALTA_PACIENTE" | "FALTA_PROFISSIONAL" | "CANCELADA_COM_ANTECEDENCIA" | "CANCELADA_TARDIA" | "FORCA_MAIOR";
type AdminClient = import("@supabase/supabase-js").SupabaseClient<Database>;

export async function settleAsaasAppointment(appointmentId: string, outcome: Outcome, actorId?: string | null, actorRole: "paciente" | "profissional" | "admin" | "sistema" = "sistema") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as AdminClient;
  const { data: appointment } = await db.from("appointments").select("id, settlement_status").eq("id", appointmentId).maybeSingle();
  if (!appointment || appointment.settlement_status === "EXECUTADO" || appointment.settlement_status === "PROCESSANDO") return { ok: true as const, skipped: true };
  await db.from("appointments").update({ settlement_status: "PROCESSANDO", outcome }).eq("id", appointmentId).eq("settlement_status", appointment.settlement_status);
  const { data: auths } = await db.from("asaas_payment_authorizations").select("id, portion, provider_payment_id, amount_centavos, platform_amount_centavos, professional_amount_centavos, status").eq("appointment_id", appointmentId).order("portion");
  if (!auths?.length) {
    await db.from("appointments").update({ settlement_status: "FALHOU" }).eq("id", appointmentId);
    return { ok: false as const, erro: "Nenhuma autorização Asaas encontrada." };
  }
  const capturePortions = outcome === "REALIZADA" ? new Set(["A", "B"]) : outcome === "FALTA_PACIENTE" || outcome === "CANCELADA_TARDIA" ? new Set(["A"]) : new Set<string>();
  let captured = 0;
  let platform = 0;
  let professional = 0;
  try {
    for (const auth of auths) {
      if (capturePortions.has(auth.portion)) {
        if (!["CONFIRMED", "RECEIVED"].includes(auth.status)) await captureAuthorizedPayment(auth.provider_payment_id);
        captured += auth.amount_centavos;
        platform += auth.platform_amount_centavos;
        professional += auth.professional_amount_centavos;
        await db.from("asaas_payment_authorizations").update({ status: "CONFIRMED", captured_at: new Date().toISOString() }).eq("id", auth.id);
      } else if (!["DELETED", "CANCELLED", "REFUNDED"].includes(auth.status)) {
        if (["CONFIRMED", "RECEIVED"].includes(auth.status)) await refundPayment(auth.provider_payment_id);
        else await cancelAuthorizedPayment(auth.provider_payment_id);
        await db.from("asaas_payment_authorizations").update({ status: "DELETED", canceled_at: new Date().toISOString() }).eq("id", auth.id);
      }
    }
    await db.from("appointments").update({
      settlement_status: "EXECUTADO", settled_at: new Date().toISOString(), amount_captured_centavos: captured,
      platform_amount_centavos: platform, professional_amount_centavos: professional,
      valor_plataforma_centavos: platform, valor_profissional_centavos: professional,
      payment_status: captured > 0 ? "aprovado" : "cancelado",
    }).eq("id", appointmentId);
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: actorId ?? null, actorRole, action: captured > 0 ? "payment_captured" : "payment_authorization_canceled", entity: "appointment", entityId: appointmentId, metadata: { outcome, portions: [...capturePortions] } });
    return { ok: true as const, capturedCentavos: captured };
  } catch (error) {
    console.error("Asaas settlement failed", { appointmentId, code: error instanceof Error ? error.message : "UNKNOWN" });
    await db.from("appointments").update({ settlement_status: "FALHOU" }).eq("id", appointmentId);
    if (actorId) {
      await db.from("notifications").insert({ user_id: actorId, appointment_id: appointmentId, tipo: "falha_liquidacao", canal: "interno", titulo: "Falha na liquidação", corpo: "A administração deve revisar a liquidação deste agendamento." }).then(() => undefined);
    }
    return { ok: false as const, erro: "A liquidação precisa de revisão da administração." };
  }
}