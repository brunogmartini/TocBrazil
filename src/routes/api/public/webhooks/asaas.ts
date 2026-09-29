import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

const webhookSchema = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  payment: z.object({ id: z.string().min(1) }),
});

function tokenMatches(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function processWebhook(request: Request) {
  const expected = process.env["ASAAS_WEBHOOK_TOKEN"];
  const received = request.headers.get("asaas-access-token") ?? "";
  if (!expected || !tokenMatches(received, expected)) return new Response("não autorizado", { status: 401 });
  const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("requisição inválida", { status: 400 });

  const { asaasConfig, getPayment } = await import("@/services/asaas.server");
  const config = asaasConfig();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: known } = await supabaseAdmin.from("asaas_webhook_events").select("id").eq("environment", config.environment).eq("event_id", parsed.data.id).maybeSingle();
  if (known) return new Response("ok", { status: 200 });

  await supabaseAdmin.from("asaas_webhook_events").insert({
    environment: config.environment,
    event_id: parsed.data.id,
    event_type: parsed.data.event,
    provider_payment_id: parsed.data.payment.id,
  });
  try {
    const payment = await getPayment(parsed.data.payment.id);
    const { data: authorization } = await supabaseAdmin.from("asaas_payment_authorizations")
      .select("id, appointment_id, portion").eq("environment", config.environment).eq("provider_payment_id", payment.id).maybeSingle();
    if (!authorization) {
      await supabaseAdmin.from("asaas_webhook_events").update({ status: "ignorado", processed_at: new Date().toISOString() }).eq("environment", config.environment).eq("event_id", parsed.data.id);
      return new Response("ok", { status: 200 });
    }
    const agora = new Date().toISOString();
    const patch = {
      provider_status: payment.status,
      status: payment.status,
      authorized_at: payment.status === "AUTHORIZED" ? agora : undefined,
      captured_at: ["CONFIRMED", "RECEIVED"].includes(payment.status) ? agora : undefined,
      canceled_at: ["DELETED", "CANCELLED"].includes(payment.status) ? agora : undefined,
      refunded_at: ["REFUNDED", "REFUND_REQUESTED"].includes(payment.status) ? agora : undefined,
    };
    await supabaseAdmin.from("asaas_payment_authorizations").update(patch).eq("id", authorization.id);
    await supabaseAdmin.from("appointments").update(authorization.portion === "A" ? { auth_status_a: payment.status } : { auth_status_b: payment.status }).eq("id", authorization.appointment_id);
    await supabaseAdmin.from("asaas_webhook_events").update({ status: "processado", processed_at: new Date().toISOString() }).eq("environment", config.environment).eq("event_id", parsed.data.id);
  } catch (error) {
    console.error("Asaas webhook processing failed", { eventId: parsed.data.id, code: error instanceof Error ? error.message : "UNKNOWN" });
    await supabaseAdmin.from("asaas_webhook_events").update({ status: "falhou", failure_code: "PROVIDER_LOOKUP_FAILED" }).eq("environment", config.environment).eq("event_id", parsed.data.id);
    return new Response("falha temporária", { status: 503 });
  }
  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/webhooks/asaas")({
  server: { handlers: {
    POST: async ({ request }) => processWebhook(request),
    GET: async () => new Response("método não permitido", { status: 405 }),
  } },
});