import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function requireAdmin(supabase: SupabaseClient<Database>, userId: string, claims: unknown) {
  if ((claims as { aal?: string } | undefined)?.aal !== "aal2") throw new Error("A autenticação em duas etapas é obrigatória.");
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Acesso restrito ao gestor.");
}

const subaccountSchema = z.object({
  label: z.string().trim().min(3).max(80), name: z.string().trim().min(3).max(120), email: z.string().email(),
  cpfCnpj: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(11).max(14)),
  birthDate: z.string().date(), mobilePhone: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
  incomeValue: z.coerce.number().positive().max(1_000_000), postalCode: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().length(8)),
  address: z.string().trim().min(3).max(120), addressNumber: z.string().trim().min(1).max(20), province: z.string().trim().min(2).max(80), complement: z.string().trim().max(80).optional(),
});

const authorizationSchema = z.object({
  runId: z.string().uuid(), totalCentavos: z.coerce.number().int().min(6700).max(500000),
  customerName: z.string().trim().min(3).max(120), customerEmail: z.string().email(), customerCpfCnpj: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(11).max(14)),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(10).max(13)), postalCode: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().length(8)), addressNumber: z.string().trim().min(1).max(20),
  holderName: z.string().trim().min(3).max(120), cardNumber: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(13).max(19)), expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/), expiryYear: z.string().regex(/^\d{4}$/), ccv: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(3).max(4)),
});

export const listarTestesAsaasSandbox = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context.supabase, context.userId, context.claims);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("asaas_sandbox_test_runs").select("id, label, wallet_id, subaccount_id, customer_id, payment_id_a, payment_id_b, status_a, status_b, total_centavos, last_action, failure_code, created_at, updated_at").order("created_at", { ascending: false }).limit(30);
  return { runs: data ?? [], publicPaymentsEnabled: false as const };
});

export const criarSubcontaTesteAsaas = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => subaccountSchema.parse(input)).handler(async ({ data, context }) => {
  await requireAdmin(context.supabase, context.userId, context.claims);
  const { createSandboxSubaccount } = await import("@/services/asaas.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const account = await createSandboxSubaccount({ ...data, complement: data.complement ?? null });
    const { data: run, error } = await supabaseAdmin.from("asaas_sandbox_test_runs").insert({ created_by: context.userId, label: data.label, subaccount_id: account.id, wallet_id: account.walletId, last_action: "subconta_criada" }).select("id, wallet_id").single();
    if (error || !run) return { ok: false as const, erro: "A subconta foi criada, mas o teste não pôde ser registrado." };
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, actor_role: "admin", action: "asaas_sandbox_subaccount_created", entity: "asaas_sandbox_test", entity_id: run.id, metadata: { environment: "sandbox" } });
    return { ok: true as const, runId: run.id, walletId: run.wallet_id };
  } catch (error) {
    console.error("Asaas sandbox subaccount test failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
    return { ok: false as const, erro: "O Asaas recusou os dados da subconta de teste." };
  }
});

export const autorizarTesteAsaas = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => authorizationSchema.parse(input)).handler(async ({ data, context }) => {
  await requireAdmin(context.supabase, context.userId, context.claims);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: run } = await supabaseAdmin.from("asaas_sandbox_test_runs").select("id, wallet_id, customer_id, payment_id_a, payment_id_b").eq("id", data.runId).maybeSingle();
  if (!run?.wallet_id) return { ok: false as const, erro: "Crie a subconta de teste antes das autorizações." };
  if (run.payment_id_a || run.payment_id_b) return { ok: false as const, erro: "Este teste já possui autorizações." };
  const { createSandboxAuthorizedPayment, createSandboxCustomer, cancelSandboxPayment } = await import("@/services/asaas.server");
  const created: Array<{ id: string; portion: "A" | "B"; status: string }> = [];
  try {
    let customerId = run.customer_id;
    if (!customerId) {
      const customer = await createSandboxCustomer({ name: data.customerName, cpfCnpj: data.customerCpfCnpj, email: data.customerEmail, phone: data.phone, externalReference: `sandbox-test:${run.id}` });
      customerId = customer.id;
    }
    const parts = [{ portion: "A" as const, amount: 5000, platform: 1000, professional: 4000 }, { portion: "B" as const, amount: data.totalCentavos - 5000, platform: 1700, professional: data.totalCentavos - 6700 }];
    const ip = getRequest()?.headers.get("cf-connecting-ip") ?? getRequest()?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    for (const part of parts) {
      const payment = await createSandboxAuthorizedPayment({ customerId, appointmentId: run.id, portion: part.portion, amountCentavos: part.amount, professionalCentavos: part.professional, professionalWalletId: run.wallet_id, card: { holderName: data.holderName, number: data.cardNumber, expiryMonth: data.expiryMonth, expiryYear: data.expiryYear, ccv: data.ccv, holder: { name: data.customerName, email: data.customerEmail, cpfCnpj: data.customerCpfCnpj, postalCode: data.postalCode, addressNumber: data.addressNumber, phone: data.phone }, remoteIp: ip } });
      created.push({ id: payment.id, portion: part.portion, status: payment.status });
      if (payment.status !== "AUTHORIZED") throw new Error("AUTHORIZATION_REFUSED");
    }
    await supabaseAdmin.from("asaas_sandbox_test_runs").update({ customer_id: customerId, payment_id_a: created[0]?.id ?? null, payment_id_b: created[1]?.id ?? null, status_a: created[0]?.status ?? null, status_b: created[1]?.status ?? null, total_centavos: data.totalCentavos, last_action: "autorizacoes_criadas", failure_code: null }).eq("id", run.id);
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, actor_role: "admin", action: "asaas_sandbox_authorizations_created", entity: "asaas_sandbox_test", entity_id: run.id, metadata: { environment: "sandbox", portions: ["A", "B"] } });
    return { ok: true as const };
  } catch (error) {
    await Promise.allSettled(created.map((item) => cancelSandboxPayment(item.id)));
    const code = error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN";
    await supabaseAdmin.from("asaas_sandbox_test_runs").update({ last_action: "falha_autorizacao", failure_code: code }).eq("id", run.id);
    console.error("Asaas sandbox authorization test failed", { runId: run.id, code });
    return { ok: false as const, erro: "A autorização de teste falhou; qualquer parcela criada foi cancelada." };
  }
});

const actionSchema = z.object({ runId: z.string().uuid(), portion: z.enum(["A", "B"]), action: z.enum(["refresh", "capture", "cancel"]) });
export const executarAcaoTesteAsaas = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => actionSchema.parse(input)).handler(async ({ data, context }) => {
  await requireAdmin(context.supabase, context.userId, context.claims);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: run } = await supabaseAdmin.from("asaas_sandbox_test_runs").select("payment_id_a, payment_id_b").eq("id", data.runId).maybeSingle();
  const paymentId = data.portion === "A" ? run?.payment_id_a : run?.payment_id_b;
  if (!paymentId) return { ok: false as const, erro: "Autorização de teste não encontrada." };
  const { getSandboxPayment, captureSandboxPayment, cancelSandboxPayment } = await import("@/services/asaas.server");
  try {
    const payment = data.action === "capture" ? await captureSandboxPayment(paymentId) : data.action === "cancel" ? await cancelSandboxPayment(paymentId) : await getSandboxPayment(paymentId);
    const statusPatch = data.portion === "A" ? { status_a: payment.status } : { status_b: payment.status };
    await supabaseAdmin.from("asaas_sandbox_test_runs").update({ ...statusPatch, last_action: `${data.action}_${data.portion.toLowerCase()}`, failure_code: null }).eq("id", data.runId);
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, actor_role: "admin", action: `asaas_sandbox_${data.action}`, entity: "asaas_sandbox_test", entity_id: data.runId, metadata: { environment: "sandbox", portion: data.portion, status: payment.status } });
    return { ok: true as const, status: payment.status };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN";
    await supabaseAdmin.from("asaas_sandbox_test_runs").update({ last_action: `falha_${data.action}`, failure_code: code }).eq("id", data.runId);
    console.error("Asaas sandbox admin action failed", { runId: data.runId, action: data.action, code });
    return { ok: false as const, erro: "O Asaas não concluiu esta ação de teste." };
  }
});