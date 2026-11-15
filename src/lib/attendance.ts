export const LINK_RELEASE_MINUTES = 15;
export const LINK_EXPIRY_HOURS = 2;
export const CONFIRMATION_HOURS = 48;
export type AttendanceStatus = "agendada" | "em_analise" | "realizada" | "falta_paciente" | "falta_profissional";
export const attendanceLabels: Record<string, string> = {
  agendada: "Agendada", em_analise: "Em análise", realizada: "Realizada",
  falta_paciente: "Falta do paciente", falta_profissional: "Falta do profissional",
};
export function confirmationAvailable(fim: string, status: string, confirmed: string | null, now = Date.now()) {
  const start = new Date(fim).getTime();
  return !confirmed && (status === "confirmada" || status === "realizada") && now >= start && now <= start + CONFIRMATION_HOURS * 3600_000;
}
export function automaticCompletionEligible(a: { fim: string; payment_status: string; professional_confirmed_at: string | null; patient_confirmed_at: string | null; hasReports: boolean }, now = Date.now()) {
  return a.payment_status === "aprovado" && Boolean(a.professional_confirmed_at) && !a.patient_confirmed_at && !a.hasReports && now >= Date.parse(a.fim) + 48 * 3600_000;
}
export function missingRoomAlert(inicio: string, hasRoom: boolean, now = Date.now()) {
  const remaining = new Date(inicio).getTime() - now;
  return !hasRoom && remaining > 0 && remaining < 24 * 3600_000;
}
export function validMeetingUrl(value: string) {
  try {
    const url = new URL(value);
    return value.length <= 2048 && url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password && !/\s/.test(value);
  } catch { return false; }
}