/**
 * Camada fina de analytics de funil. Hoje apenas registra o evento no console
 * e guarda os parâmetros de campanha (UTM) da sessão; quando um provedor for
 * escolhido, basta implementar o envio dentro de `track`.
 */
export type FunnelEvent =
  | "landing_view"
  | "content_view"
  | "professional_search"
  | "professional_profile_view"
  | "matching_started"
  | "matching_completed"
  | "schedule_started"
  | "checkout_started"
  | "payment_completed"
  | "appointment_completed"
  | "professional_signup"
  | "professional_approved";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export function captureUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem("clarea:utm", JSON.stringify(utm));
    } catch {
      /* armazenamento indisponível */
    }
    return utm;
  }
  try {
    return JSON.parse(sessionStorage.getItem("clarea:utm") ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function track(event: FunnelEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const data = { event, ...captureUtm(), ...payload };
  window.dispatchEvent(new CustomEvent("clarea:analytics", { detail: data }));
  if (import.meta.env.DEV) console.info("[analytics]", data);
}
