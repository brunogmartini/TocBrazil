import type { Database } from "@/integrations/supabase/types";

export type AsaasEnvironment = "sandbox" | "production";

type AsaasError = { errors?: Array<{ code?: string; description?: string }> };

export type AsaasPayment = {
  id: string;
  customer?: string;
  status: string;
  value: number;
  externalReference?: string | null;
  creditCard?: { creditCardToken?: string | null };
};

export type CardInput = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holder: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
  remoteIp: string;
};

export type AuthorizationInput = {
  customerId: string;
  appointmentId: string;
  portion: "A" | "B";
  amountCentavos: number;
  professionalCentavos: number;
  professionalWalletId: string;
  card: CardInput;
};

function configuredEnvironment(): AsaasEnvironment {
  const value = process.env["ASAAS_ENV"] ?? "sandbox";
  if (value !== "sandbox" && value !== "production") throw new Error("Ambiente Asaas inválido.");
  return value;
}

export function asaasConfig() {
  const environment = configuredEnvironment();
  const apiKey = environment === "sandbox"
    ? process.env["ASAAS_API_KEY_SANDBOX"]
    : process.env["ASAAS_API_KEY_PRODUCTION"];
  if (!apiKey) throw new Error(`Chave Asaas de ${environment === "sandbox" ? "sandbox" : "produção"} não configurada.`);
  const sandboxLike = /hmlg|sandbox/i.test(apiKey);
  if (environment === "production" && sandboxLike) throw new Error("Uma chave de sandbox não pode ser usada em produção.");
  return {
    environment,
    apiKey,
    baseUrl: environment === "sandbox" ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3",
  } as const;
}

async function request<T>(path: string, init: RequestInit = {}, apiKeyOverride?: string): Promise<T> {
  const config = asaasConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "TOC-Brazil/1.0",
      access_token: apiKeyOverride ?? config.apiKey,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as AsaasError | null;
    const code = body?.errors?.[0]?.code ?? `HTTP_${response.status}`;
    console.error("Asaas request failed", { path, status: response.status, code });
    throw new Error(`ASAAS_${code}`);
  }
  if (response.status === 204) return { status: "DELETED" } as T;
  return response.json() as Promise<T>;
}

function sandboxCredentials() {
  const apiKey = process.env["ASAAS_API_KEY_SANDBOX"];
  if (!apiKey) throw new Error("Chave Asaas Sandbox não configurada.");
  return { apiKey, baseUrl: "https://api-sandbox.asaas.com/v3" } as const;
}

async function sandboxRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = sandboxCredentials();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "TOC-Brazil-Sandbox-Lab/1.0",
      access_token: config.apiKey,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as AsaasError | null;
    const code = body?.errors?.[0]?.code ?? `HTTP_${response.status}`;
    console.error("Asaas sandbox request failed", { path, status: response.status, code });
    throw new Error(`ASAAS_SANDBOX_${code}`);
  }
  return response.json() as Promise<T>;
}

export async function createCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string | null;
  externalReference: string;
}) {
  return request<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      email: input.email,
      mobilePhone: input.phone || undefined,
      externalReference: input.externalReference,
      notificationDisabled: true,
    }),
  });
}

export async function createAuthorizedPayment(input: AuthorizationInput) {
  const idempotencyKey = `appointment:${input.appointmentId}:${input.portion}`;
  return request<AsaasPayment>("/payments", {
    method: "POST",
    headers: { "asaas-idempotency-key": idempotencyKey },
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "CREDIT_CARD",
      value: input.amountCentavos / 100,
      dueDate: new Date().toISOString().slice(0, 10),
      description: `Reserva de consulta TOC Brazil · parcela ${input.portion}`,
      externalReference: `${input.appointmentId}:${input.portion}`,
      authorizeOnly: true,
      creditCard: {
        holderName: input.card.holderName,
        number: input.card.number,
        expiryMonth: input.card.expiryMonth,
        expiryYear: input.card.expiryYear,
        ccv: input.card.ccv,
      },
      creditCardHolderInfo: input.card.holder,
      remoteIp: input.card.remoteIp,
      split: [{ walletId: input.professionalWalletId, fixedValue: input.professionalCentavos / 100 }],
    }),
  });
}

export async function getPayment(paymentId: string) {
  return request<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function captureAuthorizedPayment(paymentId: string) {
  return request<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}/captureAuthorizedPayment`, { method: "POST" });
}

export async function cancelAuthorizedPayment(paymentId: string) {
  const config = asaasConfig();
  const response = await fetch(`${config.baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
    method: "DELETE",
    headers: { accept: "application/json", "user-agent": "TOC-Brazil/1.0", access_token: config.apiKey },
  });
  if (!response.ok) throw new Error(`ASAAS_CANCEL_${response.status}`);
  return true;
}

export async function refundPayment(paymentId: string) {
  return request<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function createSubaccount(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate: string;
  mobilePhone: string;
  incomeValue: number;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  complement?: string | null;
}) {
  return request<{ id: string; walletId: string; apiKey?: string }>("/accounts", {
    method: "POST",
    body: JSON.stringify({ ...input, companyType: "INDIVIDUAL" }),
  });
}

export async function createSandboxSubaccount(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate: string;
  mobilePhone: string;
  incomeValue: number;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  complement?: string | null;
}) {
  return sandboxRequest<{ id: string; walletId: string; apiKey?: string }>("/accounts", {
    method: "POST",
    body: JSON.stringify({ ...input, companyType: input.cpfCnpj.length === 14 ? "LIMITED" : "INDIVIDUAL" }),
  });
}

export async function createSandboxCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  externalReference: string;
}) {
  return sandboxRequest<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({ name: input.name, cpfCnpj: input.cpfCnpj, email: input.email, mobilePhone: input.phone, externalReference: input.externalReference, notificationDisabled: true }),
  });
}

export async function createSandboxAuthorizedPayment(input: AuthorizationInput) {
  return sandboxRequest<AsaasPayment>("/payments", {
    method: "POST",
    headers: { "asaas-idempotency-key": `sandbox-test:${input.appointmentId}:${input.portion}` },
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "CREDIT_CARD",
      value: input.amountCentavos / 100,
      dueDate: new Date().toISOString().slice(0, 10),
      description: `Teste administrativo TOC Brazil · autorização ${input.portion}`,
      externalReference: `sandbox-test:${input.appointmentId}:${input.portion}`,
      authorizeOnly: true,
      creditCard: { holderName: input.card.holderName, number: input.card.number, expiryMonth: input.card.expiryMonth, expiryYear: input.card.expiryYear, ccv: input.card.ccv },
      creditCardHolderInfo: input.card.holder,
      remoteIp: input.card.remoteIp,
      split: [{ walletId: input.professionalWalletId, fixedValue: input.professionalCentavos / 100 }],
    }),
  });
}

export async function getSandboxPayment(paymentId: string) {
  return sandboxRequest<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function captureSandboxPayment(paymentId: string) {
  return sandboxRequest<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}/captureAuthorizedPayment`, { method: "POST" });
}

export async function cancelSandboxPayment(paymentId: string) {
  return sandboxRequest<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`, { method: "DELETE" });
}

export type AdminClient = import("@supabase/supabase-js").SupabaseClient<Database>;