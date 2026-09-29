import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cardSchema = z.object({
  consultaId: z.string().uuid(),
  nomeTitular: z.string().trim().min(3).max(120),
  numero: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(13).max(19)),
  mes: z.string().regex(/^(0[1-9]|1[0-2])$/),
  ano: z.string().regex(/^\d{4}$/),
  ccv: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(3).max(4)),
  cpfCnpj: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(11).max(14)),
  cep: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().length(8)),
  numeroEndereco: z.string().trim().min(1).max(20),
  telefone: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(10).max(13)),
});

type Portion = { portion: "A" | "B"; amount: number; platform: number; professional: number };

function portions(total: number): Portion[] {
  if (total < 5000) return [{ portion: "A", amount: total, platform: Math.min(1000, total), professional: Math.max(total - 1000, 0) }];
  if (total < 6700) throw new Error("O valor mínimo para reserva no cartão é R$ 67,00.");
  return [
    { portion: "A", amount: 5000, platform: 1000, professional: 4000 },
    { portion: "B", amount: total - 5000, platform: 1700, professional: total - 6700 },
  ];
}

function remoteIp() {
  const request = getRequest();
  return request?.headers.get("cf-connecting-ip")
    ?? request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "127.0.0.1";
}

async function cancelCreated(ids: string[]) {
  const { cancelAuthorizedPayment } = await import("@/services/asaas.server");
  await Promise.allSettled(ids.map((id) => cancelAuthorizedPayment(id)));
}

export const reservarComAsaas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => cardSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const [{ data: appointment }, { data: profile }] = await Promise.all([
      supabase.from("appointments")
        .select("id, patient_id, professional_id, inicio, status, valor_centavos, taxa_plataforma_centavos, asaas_payment_id_a, asaas_payment_id_b")
        .eq("id", data.consultaId).maybeSingle(),
      supabase.from("profiles").select("nome, email, telefone").eq("id", userId).maybeSingle(),
    ]);
    if (!appointment || appointment.patient_id !== userId) return { ok: false as const, erro: "Consulta não encontrada." };
    if (appointment.status !== "aguardando_pagamento") return { ok: false as const, erro: "Esta reserva não aceita um novo pagamento." };
    if (appointment.asaas_payment_id_a || appointment.asaas_payment_id_b) return { ok: false as const, erro: "Esta reserva já foi enviada ao Asaas." };
    if (new Date(appointment.inicio).getTime() > Date.now() + 72 * 60 * 60 * 1000) return { ok: false as const, erro: "Escolha um horário dentro dos próximos 3 dias para reservar no cartão." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { asaasConfig, createAuthorizedPayment, createCustomer } = await import("@/services/asaas.server");
    const config = asaasConfig();
    const { data: account } = await supabaseAdmin.from("asaas_professional_accounts")
      .select("wallet_id, status, environment").eq("professional_id", appointment.professional_id).maybeSingle();
    if (!account?.wallet_id || account.status !== "ativa" || account.environment !== config.environment) {
      return { ok: false as const, erro: "O recebimento deste profissional ainda não está ativo no Asaas." };
    }

    let { data: customer } = await supabaseAdmin.from("asaas_customers")
      .select("asaas_customer_id").eq("user_id", userId).eq("environment", config.environment).maybeSingle();
    if (!customer) {
      const created = await createCustomer({
        name: profile?.nome ?? data.nomeTitular,
        cpfCnpj: data.cpfCnpj,
        email: profile?.email ?? (claims as { email?: string }).email ?? "",
        phone: profile?.telefone ?? data.telefone,
        externalReference: userId,
      });
      const { data: saved, error } = await supabaseAdmin.from("asaas_customers").insert({
        user_id: userId, environment: config.environment, asaas_customer_id: created.id,
      }).select("asaas_customer_id").single();
      if (error || !saved) return { ok: false as const, erro: "Não foi possível preparar o pagamento." };
      customer = saved;
    }

    const createdIds: string[] = [];
    try {
      const plan = portions(appointment.valor_centavos);
      for (const item of plan) {
        const payment = await createAuthorizedPayment({
          customerId: customer.asaas_customer_id,
          appointmentId: appointment.id,
          portion: item.portion,
          amountCentavos: item.amount,
          professionalCentavos: item.professional,
          professionalWalletId: account.wallet_id,
          card: {
            holderName: data.nomeTitular,
            number: data.numero,
            expiryMonth: data.mes,
            expiryYear: data.ano,
            ccv: data.ccv,
            holder: {
              name: data.nomeTitular,
              email: profile?.email ?? (claims as { email?: string }).email ?? "",
              cpfCnpj: data.cpfCnpj,
              postalCode: data.cep,
              addressNumber: data.numeroEndereco,
              phone: data.telefone,
            },
            remoteIp: remoteIp(),
          },
        });
        createdIds.push(payment.id);
        if (payment.status !== "AUTHORIZED") throw new Error("AUTHORIZATION_REFUSED");
        await supabaseAdmin.from("asaas_payment_authorizations").insert({
          appointment_id: appointment.id,
          portion: item.portion,
          environment: config.environment,
          provider_payment_id: payment.id,
          idempotency_key: `appointment:${appointment.id}:${item.portion}`,
          amount_centavos: item.amount,
          platform_amount_centavos: item.platform,
          professional_amount_centavos: item.professional,
          status: "AUTHORIZED",
          provider_status: payment.status,
          authorized_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        });
      }
      const a = createdIds[0] ?? null;
      const b = createdIds[1] ?? null;
      await supabaseAdmin.from("appointments").update({
        asaas_payment_id_a: a,
        asaas_payment_id_b: b,
        auth_status_a: a ? "AUTHORIZED" : null,
        auth_status_b: b ? "AUTHORIZED" : null,
        authorized_at: new Date().toISOString(),
        auth_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        payment_status: "aprovado",
        status: "confirmada",
        reserva_expira_em: null,
      }).eq("id", appointment.id);
      const { writeAuditEvent } = await import("@/lib/audit.server");
      await writeAuditEvent({ actorId: userId, actorRole: "paciente", action: "payment_authorized", entity: "appointment", entityId: appointment.id, metadata: { portions: plan.map((p) => p.portion) } });
      return { ok: true as const };
    } catch (error) {
      await cancelCreated(createdIds);
      await supabaseAdmin.from("appointments").update({ settlement_status: "FALHOU" }).eq("id", appointment.id);
      console.error("Asaas authorization failed", { appointmentId: appointment.id, code: error instanceof Error ? error.message : "UNKNOWN" });
      return { ok: false as const, erro: "O cartão não foi autorizado. Nenhuma reserva foi concluída." };
    }
  });

export const statusRecebimentoAsaas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: professional } = await context.supabase.from("professionals").select("id").eq("user_id", context.userId).maybeSingle();
    if (!professional) return { temCadastro: false, status: "ausente" as const, ambiente: "sandbox" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: account } = await supabaseAdmin.from("asaas_professional_accounts").select("status, environment, wallet_id").eq("professional_id", professional.id).maybeSingle();
    return { temCadastro: true, status: account?.status ?? "pendente", ambiente: account?.environment ?? "sandbox", ativo: Boolean(account?.wallet_id && account.status === "ativa") };
  });