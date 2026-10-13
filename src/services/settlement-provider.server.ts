import type { ProviderPayment } from "@/lib/settlement";
export function settlementProvider(environment: "sandbox" | "production") {
  const key = environment === "sandbox" ? process.env["ASAAS_API_KEY_SANDBOX"] : process.env["ASAAS_API_KEY_PRODUCTION"];
  if (!key || (environment === "production" && /sandbox|hmlg/i.test(key))) throw new Error("ENVIRONMENT_UNAVAILABLE");
  const base = environment === "sandbox" ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
  async function call(id: string, action = "", method = "GET") {
    const response = await fetch(`${base}/payments/${encodeURIComponent(id)}${action}`, { method, headers: { access_token: key ?? "", "content-type": "application/json", "user-agent": "TOC-Brazil-Settlement/1.0" }, ...(method === "POST" ? { body: "{}" } : {}), signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`);
    if (method === "DELETE") return { id, status: "DELETED", value: 0 };
    return await response.json() as ProviderPayment;
  }
  return { get: (id: string) => call(id), capture: (id: string) => call(id, "/captureAuthorizedPayment", "POST"), cancel: (id: string) => call(id, "", "DELETE"), refund: (id: string) => call(id, "/refund", "POST") };
}