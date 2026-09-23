import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";
import { z } from "zod";

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

const avisoSchema = z.object({
  data: z.object({ id: z.union([z.string(), z.number()]) }),
  type: z.string().optional(),
});

function assinaturaValida(request: Request, pagamentoId: string) {
  const segredo = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
  const assinatura = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!segredo || !assinatura || !requestId) return false;

  const partes = Object.fromEntries(
    assinatura.split(",").map((parte) => {
      const [chave, ...valor] = parte.trim().split("=");
      return [chave, valor.join("=")];
    }),
  );
  if (!partes.ts || !partes.v1 || !/^\d+$/.test(partes.ts)) return false;

  // Formato oficial da assinatura de Webhooks do Mercado Pago.
  const manifesto = `id:${pagamentoId};request-id:${requestId};ts:${partes.ts};`;
  const esperada = createHmac("sha256", segredo).update(manifesto).digest("hex");
  return esperada === partes.v1;
}

async function processar(request: Request) {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) return new Response("indisponível", { status: 503 });

  const resultado = avisoSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) return new Response("requisição inválida", { status: 400 });
  const pagamentoId = String(resultado.data.data.id);
  if (!assinaturaValida(request, pagamentoId)) {
    return new Response("não autorizado", { status: 401 });
  }

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

  if (status === "aprovado") {
    await supabaseAdmin.from("notifications").insert({
      user_id: consulta.patient_id,
      appointment_id: consulta.id,
      tipo: "pagamento_aprovado",
      canal: "email",
      titulo: "Consulta confirmada",
      corpo: "Pagamento aprovado. O endereço da sala aparece na sua área pouco antes do horário.",
    });

    // E-mail de confirmação com os dados da consulta.
    try {
      const [{ data: paciente }, { data: prof }] = await Promise.all([
        supabaseAdmin.from("profiles").select("nome, email").eq("id", consulta.patient_id).maybeSingle(),
        supabaseAdmin
          .from("professionals")
          .select("nome, slot_minutos")
          .eq("id", consulta.professional_id)
          .maybeSingle(),
      ]);
      if (paciente?.email) {
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const quando = new Date(consulta.inicio).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        });
        await sendTemplateEmail("consulta-confirmada", paciente.email, {
          templateData: {
            nomePaciente: paciente.nome?.split(" ")[0] ?? null,
            nomeProfissional: prof?.nome ?? "seu profissional",
            quando,
            duracaoMinutos: prof?.slot_minutos ?? 50,
            valor: (consulta.valor_centavos / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          },
          idempotencyKey: `consulta-confirmada-${consulta.id}`,
        });
      }
    } catch (erro) {
      console.error("falha ao enviar e-mail de confirmação", erro);
    }
  }


  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => processar(request),
      GET: async () => new Response("método não permitido", { status: 405 }),
    },
  },
});
