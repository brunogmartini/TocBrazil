import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/email-templates/send-email", () => ({ sendTemplateEmail: vi.fn().mockResolvedValue({ sent: true }) }));
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { deliverAppointmentNotice } from "./appointment-email.server";
const start = Date.parse("2026-11-20T15:00:00Z");
const a = { id: "appointment-1", patient_id: "patient-1", professional_id: "professional-1", inicio: new Date(start).toISOString(), fim: new Date(start + 3600000).toISOString(), status: "confirmada", payment_status: "aprovado", meeting_url: "https://meet.google.com/abc-defg-hij", professionals: { nome: "Marina", user_id: "psychologist-1" } };
function client(appointment = a) {
  const marked = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: appointment, error: null }), update: marked };
  return { from: () => chain, rpc: vi.fn().mockResolvedValue({ data: true, error: null }), auth: { admin: { getUserById: vi.fn().mockImplementation(async (id: string) => ({ data: { user: { email: `${id}@example.com` } }, error: null })) } }, marked };
}
describe("appointment notice delivery", () => {
  it("sends paid confirmation to the actual psychologist with event idempotency", async () => {
    vi.mocked(sendTemplateEmail).mockClear(); const admin = client();
    expect(await deliverAppointmentNotice(admin, { id: "notice-1", user_id: "psychologist-1", appointment_id: a.id, tipo: "consulta_confirmada_profissional" }, start - 3600000)).toBe(true);
    expect(sendTemplateEmail).toHaveBeenCalledWith("consulta-confirmada-profissional", "psychologist-1@example.com", expect.objectContaining({ idempotencyKey: "consulta_confirmada_profissional-appointment-1" }));
    expect(admin.marked).toHaveBeenCalledOnce();
  });
  it("sends the specific private link to the actual patient at 30 minutes", async () => {
    vi.mocked(sendTemplateEmail).mockClear(); const admin = client();
    expect(await deliverAppointmentNotice(admin, { id: "notice-2", user_id: "patient-1", appointment_id: a.id, tipo: "lembrete_30min" }, start - 1800000)).toBe(true);
    expect(sendTemplateEmail).toHaveBeenCalledWith("lembrete-consulta", "patient-1@example.com", expect.objectContaining({ templateData: expect.objectContaining({ meetingUrl: a.meeting_url, emBreve: true }) }));
  });
  it("rejects a notification addressed to a different user", async () => {
    vi.mocked(sendTemplateEmail).mockClear();
    await expect(deliverAppointmentNotice(client(), { id: "notice-3", user_id: "stranger", appointment_id: a.id, tipo: "lembrete_30min" }, start - 1800000)).rejects.toThrow("APPOINTMENT_NOTICE_RECIPIENT_MISMATCH");
    expect(sendTemplateEmail).not.toHaveBeenCalled();
  });
  it("leaves the notification retryable when managed sending fails", async () => {
    vi.mocked(sendTemplateEmail).mockRejectedValueOnce(new Error("domain_not_verified")); const admin = client();
    await expect(deliverAppointmentNotice(admin, { id: "notice-4", user_id: "psychologist-1", appointment_id: a.id, tipo: "consulta_confirmada_profissional" }, start - 3600000)).rejects.toThrow("domain_not_verified");
    expect(admin.marked).not.toHaveBeenCalled();
  });
});