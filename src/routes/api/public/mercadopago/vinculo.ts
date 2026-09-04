import { createFileRoute } from "@tanstack/react-router";
import { conferirEstado, urlRetornoVinculo } from "@/lib/mercadopago.functions";

/**
 * Retorno da autorização do Mercado Pago: troca o código pelo token da conta
 * do profissional e guarda o vínculo. O código só é aceito com o estado
 * assinado pela própria plataforma.
 */
export const Route = createFileRoute("/api/public/mercadopago/vinculo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const destino = (situacao: string) =>
          Response.redirect(`${url.origin}/profissional/cadastro?recebimento=${situacao}`, 302);

        const codigo = url.searchParams.get("code");
        const estado = url.searchParams.get("state");
        if (!codigo || !estado) return destino("cancelado");

        const professionalId = await conferirEstado(estado);
        if (!professionalId) return destino("invalido");

        const clientId = process.env["MERCADOPAGO_CLIENT_ID"];
        const clientSecret = process.env["MERCADOPAGO_CLIENT_SECRET"];
        if (!clientId || !clientSecret) return destino("indisponivel");

        const resposta = await fetch("https://api.mercadopago.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            code: codigo,
            redirect_uri: urlRetornoVinculo(url.origin),
          }),
        });
        if (!resposta.ok) return destino("erro");

        const token = (await resposta.json()) as {
          access_token?: string;
          refresh_token?: string;
          public_key?: string;
          user_id?: number | string;
          expires_in?: number;
        };
        if (!token.access_token || !token.user_id) return destino("erro");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const expiraEm = token.expires_in
          ? new Date(Date.now() + token.expires_in * 1000).toISOString()
          : null;

        const { error } = await supabaseAdmin.from("mercadopago_contas").upsert(
          {
            professional_id: professionalId,
            mp_user_id: String(token.user_id),
            access_token: token.access_token,
            refresh_token: token.refresh_token ?? null,
            public_key: token.public_key ?? null,
            expira_em: expiraEm,
          },
          { onConflict: "professional_id" },
        );
        if (error) return destino("erro");

        await supabaseAdmin
          .from("professionals")
          .update({ mp_user_id: String(token.user_id), mp_vinculado_em: new Date().toISOString() })
          .eq("id", professionalId);

        return destino("ok");
      },
    },
  },
});
