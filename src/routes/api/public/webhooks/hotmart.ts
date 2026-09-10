import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook da Hotmart (livro "Como Ser Feliz com TOC").
 * Configure na Hotmart: URL https://<dominio>/api/public/webhooks/hotmart
 * e informe o "hottok" da conta no segredo HOTMART_HOTTOK.
 * O comprador é identificado pelo e-mail usado na Hotmart, que deve ser o
 * mesmo do cadastro na plataforma.
 */

type EventoHotmart = {
  event?: string;
  data?: {
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      price?: { value?: number };
    };
    buyer?: { email?: string };
  };
  // formato antigo (v1)
  transaction?: string;
  status?: string;
  email?: string;
  price?: number;
  hottok?: string;
};

const CONFIRMADOS = new Set([
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
  "approved",
  "completed",
  "APPROVED",
  "COMPLETE",
]);
const CANCELADOS = new Set([
  "PURCHASE_CANCELED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_EXPIRED",
  "canceled",
  "refunded",
  "chargeback",
  "expired",
]);

export const Route = createFileRoute("/api/public/webhooks/hotmart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const hottok = process.env["HOTMART_HOTTOK"];
        if (!hottok) return new Response("webhook não configurado", { status: 503 });

        let corpo: EventoHotmart;
        try {
          corpo = (await request.json()) as EventoHotmart;
        } catch {
          return new Response("corpo inválido", { status: 400 });
        }
        const recebido = request.headers.get("x-hotmart-hottok") ?? corpo.hottok ?? "";
        if (recebido !== hottok) return new Response("não autorizado", { status: 401 });

        const evento = corpo.event ?? corpo.status ?? "";
        const transacao = corpo.data?.purchase?.transaction ?? corpo.transaction ?? null;
        const email = (corpo.data?.buyer?.email ?? corpo.email ?? "").trim().toLowerCase();
        const valor = corpo.data?.purchase?.price?.value ?? corpo.price ?? null;
        if (!email) return new Response("ok", { status: 200 });

        const status = CONFIRMADOS.has(evento)
          ? "confirmada"
          : CANCELADOS.has(evento)
            ? "cancelada"
            : "pendente";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: perfil } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .maybeSingle();

        const { data: existente } = perfil
          ? await supabaseAdmin
              .from("livro_compras")
              .select("id")
              .eq("user_id", perfil.id)
              .maybeSingle()
          : transacao
            ? await supabaseAdmin
                .from("livro_compras")
                .select("id")
                .eq("hotmart_transacao", transacao)
                .maybeSingle()
            : { data: null };

        await supabaseAdmin.from("livro_compras").upsert(
          {
            ...(existente ? { id: existente.id } : {}),
            user_id: perfil?.id ?? null,
            email,
            status,
            origem: "hotmart",
            hotmart_transacao: transacao,
            valor_centavos: valor != null ? Math.round(Number(valor) * 100) : null,
            comprado_em: status === "confirmada" ? new Date().toISOString() : null,
            payload: corpo as never,
          },
          { onConflict: "id" },
        );

        return new Response("ok", { status: 200 });
      },
    },
  },
});
