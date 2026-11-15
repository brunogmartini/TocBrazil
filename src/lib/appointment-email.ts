import { LINK_RELEASE_MINUTES, validMeetingUrl } from "./attendance";

export function appointmentEmailEligible(a: { inicio: string; fim: string; status: string; payment_status: string }, kind: string, now: number) {
  if (a.payment_status !== "aprovado" || a.status !== "confirmada" || now >= Date.parse(a.inicio)) return false;
  return kind === "consulta_confirmada_profissional" || kind === "lembrete_24h" ||
    (kind === "lembrete_30min" && now >= Date.parse(a.inicio) - LINK_RELEASE_MINUTES * 60000);
}

export function reminderMeetingUrl(a: { inicio: string; fim: string; status: string; payment_status: string; meeting_url: string | null }, legalAllowed: boolean, now: number) {
  return legalAllowed && appointmentEmailEligible(a, "lembrete_30min", now) && a.meeting_url && validMeetingUrl(a.meeting_url) ? a.meeting_url : null;
}