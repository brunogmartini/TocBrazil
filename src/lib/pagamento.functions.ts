import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { baseSegura } from "@/lib/origem-segura";

/**
 * Checkout Mercado Pago (Checkout Pro) do sinal de agendamento.
 * O sinal confirma a reserva e é abatido do valor total da consulta.
 */
export const iniciarPagamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { consultaId: string; origem: string }) => ({
    consultaId: String(data.consultaId),
    origem: String(data.origem),
  }))
  .handler(async ({ data, context }) => {
    const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
    if (!token) {
      return { ok: false as const, erro: "O meio de pagamento ainda não está configurado." };
    }

    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select(
        "id, inicio, patient_id, professional_id, status, payment_status, valor_centavos, taxa_agendamento_centavos, duracao_minutos, professionals(nome, slug)",
      )
      .eq("id", data.consultaId)
      .maybeSingle();

    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.payment_status === "aprovado") {
      return { ok: false as const, erro: "Esta consulta já está paga." };
    }

    const prof = consulta.professionals as { nome?: string; slug?: string } | null;
    const taxa = consulta.taxa_agendamento_centavos || consulta.valor_centavos;
    const quando = new Date(consulta.inicio).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });
    const base = baseSegura(data.origem);

    const resposta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_reference: consulta.id,
        statement_descriptor: "TOCBRAZIL",
        items: [
          {
            id: consulta.id,
            title: `Sinal da consulta com ${prof?.nome ?? "profissional"} em ${quando}`,
            description: `Adiantamento incluído no valor da consulta online de ${consulta.duracao_minutos ?? 50} minutos`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: taxa / 100,
          },
        ],
        back_urls: {
          success: `${base}/painel?pagamento=aprovado`,
          pending: `${base}/painel?pagamento=pendente`,
          failure: `${base}/painel?pagamento=recusado`,
        },
        auto_return: "approved",
        notification_url: `${base}/api/public/webhooks/mercadopago`,
      }),
    });

    if (!resposta.ok) {
      return { ok: false as const, erro: "Não foi possível abrir o pagamento agora." };
    }

    const pref = (await resposta.json()) as {
      id: string;
      init_point?: string;
      sandbox_init_point?: string;
    };
    const link = pref.init_point ?? pref.sandbox_init_point;
    if (!link) return { ok: false as const, erro: "Não foi possível abrir o pagamento agora." };

    return { ok: true as const, link, preferenciaId: pref.id };
  });
