import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";

const tentativaSchema = z.object({ email: z.string().trim().email().max(255) });

export const autorizarTentativaGestor = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tentativaSchema.parse(data))
  .handler(async ({ data }) => {
    const request = getRequest();
    const ip = request?.headers.get("cf-connecting-ip") ?? request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
    const identificadorHash = createHash("sha256")
      .update(`${data.email.toLowerCase()}|${ip}`)
      .digest("hex");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const desde = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("tentativas_login_gestor")
      .select("id", { count: "exact", head: true })
      .eq("identificador_hash", identificadorHash)
      .gte("created_at", desde);
    if ((count ?? 0) >= 5) {
      return { ok: false as const, erro: "Muitas tentativas. Aguarde 15 minutos para tentar novamente." };
    }
    await supabaseAdmin.from("tentativas_login_gestor").insert({ identificador_hash: identificadorHash });
    return { ok: true as const };
  });