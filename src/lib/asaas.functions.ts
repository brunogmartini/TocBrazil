import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { institucional } from "@/config/institucional";

const cardSchema = z.object({
  consultaId: z.string().uuid(),
});

const iniciarSchema = z.object({
  consultaId: z.string().uuid(),
  // UNDEFINED abre a página segura com Pix e cartão à escolha do paciente.
  metodo: z.enum(["UNDEFINED", "PIX", "CREDIT_CARD"]).default("UNDEFINED"),
});

function dataHojeSP(): string {
  // YYYY-MM-DD no fuso de São Paulo (en-CA formata em ISO).
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/**
 * Opção 1 — inicia o pagamento da consulta na página segura do Asaas.
 * Cobrança única (R$200) sem split: o valor é capturado e mantido na conta da
 * plataforma; o profissional é pago por transferência após a consulta, e o
 * eventual saldo não retido vira crédito do paciente. Nenhum dado de cartão
 * passa pelo nosso servidor — o paciente paga na própria página do Asaas.
 */
export const iniciarPagamentoAsaas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => iniciarSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!institucional.pagamentosAtivos) {
      return { ok: false as const, erro: "Os pagamentos estarão disponíveis após a formalização da empresa." };
    }

    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select(
        "id, patient_id, professional_id, valor_centavos, payment_status, inicio, duracao_minutos, asaas_payment_id",
      )
      .eq("id", data.consultaId)
      .maybeSingle();

    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.payment_status === "aprovado") {
      return { ok: false as const, erro: "Esta consulta já está paga." };
    }

    const { asaasConfig, createCustomer, createHostedPayment } = await import("@/services/asaas.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { environment } = asaasConfig();

    // 1. Garante o cliente Asaas do paciente (um por ambiente).
    const { data: clienteExistente } = await supabaseAdmin
      .from("asaas_customers")
      .select("asaas_customer_id")
      .eq("user_id", userId)
      .eq("environment", environment)
      .maybeSingle();

    let customerId = clienteExistente?.asaas_customer_id ?? null;
    if (!customerId) {
      const { data: perfil } = await supabaseAdmin
        .from("profiles")
        .select("nome, email, cpf, telefone")
        .eq("id", userId)
        .maybeSingle();
      if (!perfil?.cpf || !perfil.nome || !perfil.email) {
        return { ok: false as const, erro: "Complete seu nome, e-mail e CPF no perfil antes de pagar." };
      }
      try {
        const cliente = await createCustomer({
          name: perfil.nome,
          cpfCnpj: perfil.cpf,
          email: perfil.email,
          phone: perfil.telefone,
          externalReference: userId,
        });
        customerId = cliente.id;
        await supabaseAdmin
          .from("asaas_customers")
          .insert({ user_id: userId, environment, asaas_customer_id: cliente.id });
      } catch (error) {
        console.error("Asaas createCustomer failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
        return { ok: false as const, erro: "Não foi possível iniciar o pagamento agora." };
      }
    }

    // 2. Cria a cobrança única na página segura.
    const { data: prof } = await supabaseAdmin
      .from("professionals")
      .select("nome")
      .eq("id", consulta.professional_id)
      .maybeSingle();
    const quando = new Date(consulta.inicio).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });
    try {
      const cobranca = await createHostedPayment({
        customerId,
        valueCentavos: consulta.valor_centavos,
        dueDate: dataHojeSP(),
        description: `Consulta online de ${consulta.duracao_minutos ?? 50} min com ${prof?.nome ?? "profissional"} em ${quando}`,
        externalReference: consulta.id,
        billingType: data.metodo,
      });

      await supabaseAdmin
        .from("appointments")
        .update({
          asaas_payment_id: cobranca.id,
          asaas_invoice_url: cobranca.invoiceUrl ?? null,
          asaas_payment_method: data.metodo,
          payment_status: "pendente",
          status: "aguardando_pagamento",
        })
        .eq("id", consulta.id);

      if (!cobranca.invoiceUrl) {
        return { ok: false as const, erro: "Não foi possível abrir a página de pagamento." };
      }
      return { ok: true as const, invoiceUrl: cobranca.invoiceUrl, paymentId: cobranca.id };
    } catch (error) {
      console.error("Asaas createHostedPayment failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
      return { ok: false as const, erro: "Não foi possível abrir a página de pagamento agora." };
    }
  });

export const reservarComAsaas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => cardSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: appointment } = await context.supabase.from("appointments").select("patient_id").eq("id", data.consultaId).maybeSingle();
    if (!appointment || appointment.patient_id !== context.userId) return { ok: false as const, erro: "Consulta não encontrada." };
    return { ok: false as const, erro: "O pagamento está temporariamente indisponível enquanto migramos para a página segura do Asaas." };
  });

/** Saldo de crédito do paciente (gerado em no-shows) e seus lançamentos. */
export const meuSaldoCredito = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { asaasConfig } = await import("@/services/asaas.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { environment } = asaasConfig();
    const { data: creditos } = await supabaseAdmin
      .from("patient_credits")
      .select("id, amount_centavos, origin, status, created_at")
      .eq("patient_id", context.userId)
      .eq("environment", environment)
      .order("created_at", { ascending: false });
    const lista = creditos ?? [];
    const saldoCentavos = lista
      .filter((c) => c.status === "disponivel")
      .reduce((soma, c) => soma + c.amount_centavos, 0);
    return { saldoCentavos, creditos: lista };
  });

const reembolsoSchema = z.object({ creditoId: z.string().uuid() });

/** Reembolso sob demanda: devolve ao cartão/Pix do paciente o crédito disponível. */
export const solicitarReembolsoCredito = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reembolsoSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { asaasConfig, refundPayment } = await import("@/services/asaas.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { environment } = asaasConfig();

    const { data: credito } = await supabaseAdmin
      .from("patient_credits")
      .select("id, patient_id, amount_centavos, status, provider_payment_id, environment")
      .eq("id", data.creditoId)
      .maybeSingle();
    if (!credito || credito.patient_id !== context.userId || credito.environment !== environment) {
      return { ok: false as const, erro: "Crédito não encontrado." };
    }
    if (credito.status !== "disponivel") {
      return { ok: false as const, erro: "Este crédito não está disponível para reembolso." };
    }
    if (!credito.provider_payment_id) {
      return { ok: false as const, erro: "Crédito sem cobrança de origem; fale com o suporte." };
    }

    // Marca em reembolso e registra o pedido (UNIQUE(credit_id) impede duplicidade).
    await supabaseAdmin.from("patient_credits").update({ status: "reembolsando" }).eq("id", credito.id);
    const { error: pedidoErr } = await supabaseAdmin.from("patient_credit_refunds").insert({
      credit_id: credito.id,
      patient_id: context.userId,
      environment,
      amount_centavos: credito.amount_centavos,
      status: "processando",
    });
    if (pedidoErr && pedidoErr.code !== "23505") {
      await supabaseAdmin.from("patient_credits").update({ status: "disponivel" }).eq("id", credito.id);
      return { ok: false as const, erro: "Não foi possível registrar o reembolso agora." };
    }

    try {
      // Reembolso parcial da cobrança original (o restante — a taxa — fica retido).
      await refundPayment(credito.provider_payment_id, credito.amount_centavos);
      // A confirmação final (status 'reembolsado'/'concluido') chega pelo webhook.
      return { ok: true as const };
    } catch (error) {
      console.error("Asaas refund failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
      await supabaseAdmin.from("patient_credits").update({ status: "disponivel" }).eq("id", credito.id);
      await supabaseAdmin.from("patient_credit_refunds").update({ status: "falhou", failure_code: "REFUND_PROVIDER_FAILED" }).eq("credit_id", credito.id);
      return { ok: false as const, erro: "O reembolso não foi concluído pelo provedor. Tente novamente." };
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