import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tentativaSchema = z.object({ email: z.string().trim().email().max(255) });

export const autorizarTentativaLogin = createServerFn({ method: "POST" })
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

export const registrarEventoAutenticacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { evento: "login" | "logout"; papel: "paciente" | "profissional" | "admin" }) => ({
    evento: data.evento,
    papel: data.papel,
  }))
  .handler(async ({ data, context }) => {
    const { data: papeis } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const papeisPermitidos = new Set((papeis ?? []).map((item) => item.role as string));
    const papel = data.papel === "admin" ? "admin" : data.papel;
    if (!papeisPermitidos.has(papel)) return { ok: false as const };
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: papel, action: data.evento, entity: "auth_session", entityId: context.userId });
    return { ok: true as const };
  });

/**
 * Remove apenas configurações TOTP incompletas da própria conta gestora.
 * Um fator verificado nunca é alterado por esta recuperação.
 */
export const limparMfaGestorIncompleto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: papel, error: erroPapel } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (erroPapel || !papel) throw new Error("Acesso não autorizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: context.userId });
    if (error) throw error;

    for (const fator of data.factors) {
      if (fator.status !== "unverified") continue;
      const { error: erroExclusao } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        userId: context.userId,
        id: fator.id,
      });
      if (erroExclusao) throw erroExclusao;
    }
    return { ok: true as const };
  });