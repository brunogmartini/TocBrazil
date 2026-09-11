import { createFileRoute } from "@tanstack/react-router";

type PagamentoMP = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_method_id?: string;
};

const MAPA: Record<string, "pendente" | "aprovado" | "recusado" | "estornado" | "cancelado"> = {
  approved: "aprovado",
  authorized: "aprovado",
  pending: "pendente",
  in_process: "pendente",
  in_mediation: "pendente",
  rejected: "recusado",
  cancelled: "cancelado",
  refunded: "estornado",
  charged_back: "estornado",
};

async function processar(request: Request) {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) return new Response("sem configuração", { status: 200 });

  const url = new URL(request.url);
  let pagamentoId: string | null =
    url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;

  if (request.method === "POST") {
    try {
      const corpo = (await request.json()) as { data?: { id?: string | number }; type?: string };
      if (corpo.data?.id) pagamentoId = String(corpo.data.id);
    } catch {
      /* aviso sem corpo JSON */
    }
  }
  if (!pagamentoId) return new Response("ok", { status: 200 });

  // A fonte da verdade é sempre a consulta direta ao Mercado Pago.
  const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resposta.ok) return new Response("ok", { status: 200 });

  const pg = (await resposta.json()) as PagamentoMP;
  const consultaId = pg.external_reference;
  const status = MAPA[pg.status] ?? "pendente";
  if (!consultaId) return new Response("ok", { status: 200 });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: consulta } = await supabaseAdmin
    .from("appointments")
    .select(
      "id, patient_id, professional_id, valor_centavos, valor_profissional_centavos, valor_plataforma_centavos, inicio",
    )
    .eq("id", consultaId)
    .maybeSingle();
  if (!consulta) return new Response("ok", { status: 200 });

  await supabaseAdmin
    .from("appointments")
    .update({
      payment_status: status,
      status:
        status === "aprovado"
          ? "confirmada"
          : status === "cancelado" || status === "estornado"
            ? "cancelada"
            : "aguardando_pagamento",
    })
    .eq("id", consulta.id);

  await supabaseAdmin.from("payments").upsert(
    {
      appointment_id: consulta.id,
      patient_id: consulta.patient_id,
      professional_id: consulta.professional_id,
      provider: "mercadopago",
      provider_ref: String(pg.id),
      metodo: pg.payment_method_id ?? "cartao_credito",
      status,
      valor_centavos: consulta.valor_centavos,
      valor_profissional_centavos: consulta.valor_profissional_centavos,
      valor_plataforma_centavos: consulta.valor_plataforma_centavos,
      erro: status === "recusado" ? (pg.status_detail ?? null) : null,
    },
    { onConflict: "provider_ref" },
  );

  // O sinal confirma a reserva e é abatido do valor total da consulta.
  if (status === "aprovado") {
    await supabaseAdmin.from("notifications").insert({
      user_id: consulta.patient_id,
      appointment_id: consulta.id,
      tipo: "pagamento_aprovado",
      canal: "email",
      titulo: "Consulta confirmada",
      corpo: "Recebemos o sinal de agendamento. Ele será abatido do valor total da consulta, e o link da videochamada já está na sua área.",
    });
  }

  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => processar(request),
      GET: async ({ request }) => processar(request),
    },
  },
});
