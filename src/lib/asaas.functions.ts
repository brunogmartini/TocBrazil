import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cardSchema = z.object({
  consultaId: z.string().uuid(),
});

export const reservarComAsaas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => cardSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: appointment } = await context.supabase.from("appointments").select("patient_id").eq("id", data.consultaId).maybeSingle();
    if (!appointment || appointment.patient_id !== context.userId) return { ok: false as const, erro: "Consulta não encontrada." };
    return { ok: false as const, erro: "O pagamento está temporariamente indisponível enquanto migramos para a página segura do Asaas." };
  });

export const statusRecebimentoAsaas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: professional } = await context.supabase.from("professionals").select("id").eq("user_id", context.userId).maybeSingle();
    if (!professional) return { temCadastro: false, status: "ausente" as const, ambiente: "sandbox" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: account } = await supabaseAdmin.from("asaas_professional_accounts").select("status, environment, wallet_id").eq("professional_id", professional.id).maybeSingle();
    return { temCadastro: true, status: account?.status ?? "pendente", ambiente: account?.environment ?? "sandbox", ativo: Boolean(account?.wallet_id && account.status === "ativa") };
  });