import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { institucional } from "@/config/institucional";

/**
 * Vínculo da conta Mercado Pago de cada profissional.
 * O profissional autoriza a plataforma (OAuth do Mercado Pago) e passa a
 * receber o valor líquido da consulta direto na própria conta, com a taxa fixa
 * da plataforma separada automaticamente (marketplace_fee).
 */

export function urlRetornoVinculo(origem: string) {
  const configurada = process.env["MERCADOPAGO_REDIRECT_URI"];
  if (configurada) return configurada;
  const base = origem.startsWith("http") ? origem.replace(/\/$/, "") : "";
  return `${base}/api/public/mercadopago/vinculo`;
}

export async function assinarEstado(valor: string) {
  const { createHmac } = await import("crypto");
  const segredo = process.env["MERCADOPAGO_CLIENT_SECRET"] ?? "";
  const assinatura = createHmac("sha256", segredo).update(valor).digest("hex").slice(0, 32);
  return `${valor}.${assinatura}`;
}

export async function conferirEstado(estado: string) {
  const partes = estado.split(".");
  if (partes.length !== 2) return null;
  const [valor] = partes as [string, string];
  const esperado = await assinarEstado(valor);
  return esperado === estado ? valor : null;
}

export const statusVinculoMercadoPago = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("professionals")
      .select("id, mp_user_id, mp_vinculado_em")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      configurado: Boolean(
        process.env["MERCADOPAGO_CLIENT_ID"] && process.env["MERCADOPAGO_CLIENT_SECRET"],
      ),
      temCadastro: Boolean(prof),
      vinculado: Boolean(prof?.mp_user_id),
      contaId: prof?.mp_user_id ?? null,
      vinculadoEm: prof?.mp_vinculado_em ?? null,
    };
  });

export const iniciarVinculoMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { origem: string }) => ({ origem: String(data.origem) }))
  .handler(async ({ data, context }) => {
    if (!institucional.pagamentosAtivos) {
      return { ok: false as const, erro: "O recebimento será ativado após a formalização da empresa." };
    }
    const clientId = process.env["MERCADOPAGO_CLIENT_ID"];
    if (!clientId || !process.env["MERCADOPAGO_CLIENT_SECRET"]) {
      return { ok: false as const, erro: "O recebimento ainda não está configurado." };
    }

    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { ok: false as const, erro: "Complete seu cadastro primeiro." };

    const estado = await assinarEstado(prof.id);
    const url = new URL("https://auth.mercadopago.com/authorization");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("platform_id", "mp");
    url.searchParams.set("state", estado);
    url.searchParams.set("redirect_uri", urlRetornoVinculo(data.origem));

    return { ok: true as const, link: url.toString() };
  });

export const desvincularMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof) return { ok: false as const, erro: "Cadastro não encontrado." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("mercadopago_contas").delete().eq("professional_id", prof.id);
    await supabaseAdmin
      .from("professionals")
      .update({ mp_user_id: null, mp_vinculado_em: null })
      .eq("id", prof.id);

    return { ok: true as const };
  });
