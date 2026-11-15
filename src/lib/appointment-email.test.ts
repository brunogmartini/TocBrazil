import { describe, expect, it } from "vitest";
import { appointmentEmailEligible, reminderMeetingUrl } from "./appointment-email";
const start = Date.parse("2026-11-20T15:00:00Z");
const a = { inicio: new Date(start).toISOString(), fim: new Date(start + 3600000).toISOString(), status: "confirmada", payment_status: "aprovado", meeting_url: "https://meet.google.com/abc-defg-hij" };
describe("appointment emails", () => {
  it("notifies psychologist only after approved payment", () => { expect(appointmentEmailEligible(a, "consulta_confirmada_profissional", start - 3600000)).toBe(true); expect(appointmentEmailEligible({ ...a, payment_status: "pendente" }, "consulta_confirmada_profissional", start - 3600000)).toBe(false); });
  it("releases patient's reminder exactly 30 minutes before, never earlier", () => { expect(reminderMeetingUrl(a, true, start - 1800000 - 1)).toBe(null); expect(reminderMeetingUrl(a, true, start - 1800000)).toBe(a.meeting_url); });
  it("never sends unpaid or canceled consultation links", () => { expect(reminderMeetingUrl({ ...a, payment_status: "pendente" }, true, start - 1800000)).toBe(null); expect(reminderMeetingUrl({ ...a, status: "cancelada" }, true, start - 1800000)).toBe(null); });
  it("preserves legal gate and rejects absent or insecure links", () => { expect(reminderMeetingUrl(a, false, start - 1800000)).toBe(null); expect(reminderMeetingUrl({ ...a, meeting_url: null }, true, start - 1800000)).toBe(null); expect(reminderMeetingUrl({ ...a, meeting_url: "http://example.com" }, true, start - 1800000)).toBe(null); });
  it("does not send stale reminders after start", () => expect(reminderMeetingUrl(a, true, start)).toBe(null));
});