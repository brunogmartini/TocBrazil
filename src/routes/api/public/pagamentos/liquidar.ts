import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/pagamentos/liquidar")({
  server: { handlers: {
    POST: async ({ request }) => {
      const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
      if (!token) return new Response(null, { status: 401 });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.rpc("cron_token_valido", { _nome: "notificacoes", _token: token });
      if (error || data !== true) return new Response(null, { status: 401 });
      try {
        const { processSettlementQueue } = await import("@/services/asaas-settlement.server");
        return Response.json(await processSettlementQueue());
      } catch { return new Response(null, { status: 503 }); }
    },
    GET: async () => new Response(null, { status: 405 }),
  } },
});