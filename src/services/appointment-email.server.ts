import { appointmentEmailEligible, reminderMeetingUrl } from "@/lib/appointment-email";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

// Existing appointment notifications only; recipients are resolved from the appointment.
export async function deliverAppointmentNotice(admin: any, n: { id: string; user_id: string; appointment_id: string | null; tipo: string }, now = Date.now()) {
  if (!n.appointment_id) return false;
  const { data: a, error } = await admin.from("appointments").select("id,patient_id,professional_id,inicio,fim,status,payment_status,meeting_url,professionals(nome,user_id)").eq("id", n.appointment_id).maybeSingle();
  if (error) throw new Error("APPOINTMENT_NOTICE_LOOKUP_FAILED");
  if (!a || !appointmentEmailEligible(a, n.tipo, now)) {
    // Keep unpaid upcoming reservations pending; payment may still be approved.
    if (a && a.status === "aguardando_pagamento" && now < Date.parse(a.inicio)) return false;
    if (a && n.tipo === "lembrete_30min" && now < Date.parse(a.inicio) - 30 * 60000) return false;
    await admin.from("notifications").update({ enviada_em: new Date(now).toISOString() }).eq("id", n.id);
    return false;
  }
  const professional = n.tipo === "consulta_confirmada_profissional";
  const recipientId = professional ? a.professionals?.user_id : a.patient_id;
  if (!recipientId || recipientId !== n.user_id) throw new Error("APPOINTMENT_NOTICE_RECIPIENT_MISMATCH");
  const { data: account, error: accountError } = await admin.auth.admin.getUserById(recipientId);
  if (accountError || !account?.user?.email) throw new Error("APPOINTMENT_NOTICE_EMAIL_MISSING");
  let meetingUrl: string | null = null;
  if (n.tipo === "lembrete_30min") {
    const { data: legalAllowed, error: legalError } = await admin.rpc("legal_access_allowed", { _user_id: a.patient_id });
    if (legalError) throw new Error("APPOINTMENT_NOTICE_LEGAL_CHECK_FAILED");
    meetingUrl = reminderMeetingUrl(a, legalAllowed === true, now);
    // Never substitute a profile URL or send a link before its private access window.
    if (!meetingUrl) return false;
  }
  const result = await sendTemplateEmail(professional ? "consulta-confirmada-profissional" : "lembrete-consulta", account.user.email, {
    templateData: {
      nomeProfissional: a.professionals?.nome ?? "seu psicólogo",
      quando: new Date(a.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }),
      emBreve: n.tipo === "lembrete_30min",
      meetingUrl,
    },
    idempotencyKey: `${n.tipo}-${a.id}`,
  });
  const { error: updateError } = await admin.from("notifications").update({ enviada_em: new Date(now).toISOString() }).eq("id", n.id);
  if (updateError) throw new Error("APPOINTMENT_NOTICE_MARK_FAILED");
  return result.sent;
}