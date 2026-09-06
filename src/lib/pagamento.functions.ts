import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Checkout Mercado Pago (Checkout Pro).
 * A consulta nasce como "aguardando_pagamento"; ao confirmar o pagamento,
 * o aviso do Mercado Pago (webhook) confirma a consulta e registra o repasse.
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
        "id, inicio, patient_id, professional_id, status, payment_status, valor_centavos, valor_plataforma_centavos, professionals(nome, slug, comissao_percent, mp_user_id)",
      )
      .eq("id", data.consultaId)
      .maybeSingle();

    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.payment_status === "aprovado") {
      return { ok: false as const, erro: "Esta consulta já está paga." };
    }

    const prof = consulta.professionals as {
      nome?: string;
      slug?: string;
      comissao_percent?: number;
      mp_user_id?: string | null;
    } | null;

    // Split: quando o profissional já ligou a conta Mercado Pago, o pagamento
    // é criado na conta dele e a plataforma retém apenas a comissão.
    let tokenCobranca = token;
    let taxaPlataforma: number | null = null;
    if (prof?.mp_user_id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: contaMp } = await supabaseAdmin
        .from("mercadopago_contas")
        .select("access_token")
        .eq("professional_id", consulta.professional_id)
        .maybeSingle();
      if (contaMp?.access_token) {
        tokenCobranca = contaMp.access_token;
        const comissao = Number(prof.comissao_percent ?? 30);
        const valorReais = consulta.valor_centavos / 100;
        taxaPlataforma = Math.round(valorReais * (comissao / 100) * 100) / 100;
      }
    }
    const quando = new Date(consulta.inicio).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });
    const base = data.origem.startsWith("http") ? data.origem.replace(/\/$/, "") : "";

    const resposta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenCobranca}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_reference: consulta.id,
        statement_descriptor: "TOCBRAZIL",
        items: [
          {
            id: consulta.id,
            title: `Consulta com ${prof?.nome ?? "profissional com experiência em TOC"} — ${quando}`,
            description: "Consulta online de 50 minutos na TOC Brazil",
            quantity: 1,
            currency_id: "BRL",
            unit_price: consulta.valor_centavos / 100,
          },
        ],
        back_urls: {
          success: `${base}/painel?pagamento=aprovado`,
          pending: `${base}/painel?pagamento=pendente`,
          failure: `${base}/painel?pagamento=recusado`,
        },
        auto_return: "approved",
        notification_url: `${base}/api/public/webhooks/mercadopago`,
        ...(taxaPlataforma !== null ? { marketplace_fee: taxaPlataforma } : {}),
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
