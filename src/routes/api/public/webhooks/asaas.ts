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
  const received = request.headers.get("asaas-access-token");
  if (!expected || !received || !tokenMatches(received, expected)) return new Response(null, { status: 401 });
  const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("requisição inválida", { status: 400 });

  const { asaasConfig, getPayment } = await import("@/services/asaas.server");
  const config = asaasConfig();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: claimError } = await supabaseAdmin.from("asaas_webhook_events").insert({
    environment: config.environment,
    event_id: parsed.data.id,
    event_type: parsed.data.event,
    provider_payment_id: parsed.data.payment.id,
  });
  if (claimError?.code === "23505") return new Response(null, { status: 204 });
  if (claimError) {
    console.error("Asaas webhook event claim failed", { eventId: parsed.data.id, code: claimError.code });
    return new Response("falha temporária", { status: 503 });
  }
  try {
    // Fonte da verdade: reconsulta direta ao Asaas, nunca o corpo do webhook.
    const payment = await getPayment(parsed.data.payment.id);
    const agora = new Date().toISOString();

    // OPÇÃO 1 — cobrança única vinculada ao appointment por asaas_payment_id.
    const { data: consulta } = await supabaseAdmin
      .from("appointments")
      .select("id, patient_id, professional_id, valor_centavos, valor_profissional_centavos, valor_plataforma_centavos")
      .eq("asaas_payment_id", payment.id)
      .maybeSingle();

    if (consulta) {
      const pago = ["CONFIRMED", "RECEIVED"].includes(payment.status);
      const estornado = ["REFUNDED", "REFUND_REQUESTED"].includes(payment.status);

      if (pago) {
        await supabaseAdmin
          .from("appointments")
          .update({
            payment_status: "aprovado",
            status: "confirmada",
            // Guarda o método real escolhido pelo paciente na página do Asaas.
            ...(payment.billingType ? { asaas_payment_method: payment.billingType } : {}),
          })
          .eq("id", consulta.id);
        await supabaseAdmin.from("payments").upsert(
          {
            appointment_id: consulta.id,
            patient_id: consulta.patient_id,
            professional_id: consulta.professional_id,
            provider: "asaas",
            provider_ref: payment.id,
            metodo: payment.billingType === "PIX" ? "pix" : "cartao_credito",
            status: "aprovado",
            valor_centavos: consulta.valor_centavos,
            valor_profissional_centavos: consulta.valor_profissional_centavos,
            valor_plataforma_centavos: consulta.valor_plataforma_centavos,
          },
          { onConflict: "provider_ref" },
        );
      } else if (estornado) {
        await supabaseAdmin.from("payments").update({ status: "estornado" }).eq("provider_ref", payment.id);
        // Fecha o crédito e o pedido de reembolso correspondentes, se houver.
        await supabaseAdmin
          .from("patient_credits")
          .update({ status: "reembolsado" })
          .eq("provider_payment_id", payment.id)
          .eq("status", "reembolsando");
        const { data: credito } = await supabaseAdmin
          .from("patient_credits")
          .select("id")
          .eq("provider_payment_id", payment.id)
          .maybeSingle();
        if (credito) {
          await supabaseAdmin
            .from("patient_credit_refunds")
            .update({ status: "concluido", processed_at: agora })
            .eq("credit_id", credito.id)
            .neq("status", "concluido");
        }
      }

      await supabaseAdmin.from("asaas_webhook_events").update({ status: "processado", processed_at: agora, failure_code: null, error_message: null }).eq("environment", config.environment).eq("event_id", parsed.data.id);
      return new Response(null, { status: 204 });
    }

    // LEGADO — modelo A/B de pré-autorização.
    const { data: authorization } = await supabaseAdmin.from("asaas_payment_authorizations")
      .select("id, appointment_id, portion").eq("environment", config.environment).eq("provider_payment_id", payment.id).maybeSingle();
    if (!authorization) {
      await supabaseAdmin.from("asaas_webhook_events").update({ status: "ignorado", processed_at: agora }).eq("environment", config.environment).eq("event_id", parsed.data.id);
      return new Response(null, { status: 204 });
    }
    const patch = {
      provider_status: payment.status,
      status: payment.status,
      ...(payment.status === "AUTHORIZED" ? { authorized_at: agora } : {}),
      ...(["CONFIRMED", "RECEIVED"].includes(payment.status) ? { captured_at: agora } : {}),
      ...(["DELETED", "CANCELLED"].includes(payment.status) ? { canceled_at: agora } : {}),
      ...(["REFUNDED", "REFUND_REQUESTED"].includes(payment.status) ? { refunded_at: agora } : {}),
    };
    await supabaseAdmin.from("asaas_payment_authorizations").update(patch).eq("id", authorization.id);
    await supabaseAdmin.from("appointments").update(authorization.portion === "A" ? { auth_status_a: payment.status } : { auth_status_b: payment.status }).eq("id", authorization.appointment_id);
    await supabaseAdmin.from("asaas_webhook_events").update({ status: "processado", processed_at: agora, failure_code: null, error_message: null }).eq("environment", config.environment).eq("event_id", parsed.data.id);
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN";
    console.error("Asaas webhook processing failed", { eventId: parsed.data.id, code });
    await supabaseAdmin.from("asaas_webhook_events").update({ status: "falhou", failure_code: "PROVIDER_LOOKUP_FAILED", error_message: "Não foi possível confirmar o pagamento diretamente no Asaas.", processed_at: new Date().toISOString() }).eq("environment", config.environment).eq("event_id", parsed.data.id);
    return new Response("falha temporária", { status: 503 });
  }
  return new Response(null, { status: 204 });
}

export const Route = createFileRoute("/api/public/webhooks/asaas")({
  server: { handlers: {
    POST: async ({ request }) => processWebhook(request),
    GET: async () => new Response("método não permitido", { status: 405 }),
  } },
});