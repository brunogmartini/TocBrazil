import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { validarDadosRepasse, type DadosRepasse } from "@/lib/repasse";

export type RepasseSalvo = DadosRepasse & { conferido_em: string | null; updated_at: string };

const CAMPOS = "metodo, pix_tipo, pix_chave, banco_codigo, agencia, conta, tipo_conta, titular_nome, titular_documento, conferido_em, updated_at";

const entradaSchema = z.object({
  metodo: z.enum(["pix", "banco"]),
  pixTipo: z.enum(["cpf", "cnpj", "email", "telefone", "aleatoria"]).nullable().optional(),
  pixChave: z.string().max(140).nullable().optional(),
  bancoCodigo: z.string().max(10).nullable().optional(),
  agencia: z.string().max(10).nullable().optional(),
  conta: z.string().max(20).nullable().optional(),
  tipoConta: z.enum(["corrente", "poupanca"]).nullable().optional(),
  titularNome: z.string().max(140),
  titularDocumento: z.string().max(20),
});

/** Dados para repasse do próprio profissional. */
export const meusDadosRepasse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prof } = await context.supabase.from("professionals").select("id").eq("user_id", context.userId).maybeSingle();
    if (!prof) return { temCadastro: false as const, dados: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("professional_payout_destinations").select(CAMPOS).eq("professional_id", prof.id).maybeSingle();
    return { temCadastro: true as const, dados: (data ?? null) as RepasseSalvo | null };
  });

/** Salva os dados para repasse; qualquer alteração volta para conferência da gestão. */
export const salvarDadosRepasse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => entradaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: prof } = await context.supabase.from("professionals").select("id, cpf, cnpj").eq("user_id", context.userId).maybeSingle();
    if (!prof) return { ok: false as const, erro: "Salve seus dados profissionais antes de informar o repasse." };
    const validacao = validarDadosRepasse(data, prof);
    if (!validacao.ok) return validacao;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("professional_payout_destinations")
      .upsert({ professional_id: prof.id, ...validacao.dados }, { onConflict: "professional_id" });
    if (error) return { ok: false as const, erro: "Não foi possível salvar os dados para repasse." };
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: "profissional", action: "profile_data_changed", entity: "professional_payout", entityId: prof.id, metadata: { campos: Object.keys(validacao.dados) } });
    return { ok: true as const };
  });

/** Gestão confirma que conferiu os dados para repasse do profissional. */
export const conferirDadosRepasseAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!admin) return { ok: false as const, erro: "Acesso restrito à gestão." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: prof }, { data: repasse }] = await Promise.all([
      supabaseAdmin.from("professionals").select("cpf, cnpj").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("professional_payout_destinations").select(CAMPOS).eq("professional_id", data.id).maybeSingle(),
    ]);
    if (!prof) return { ok: false as const, erro: "Profissional não encontrado." };
    if (!repasse) return { ok: false as const, erro: "O profissional ainda não informou os dados para repasse." };
    const { apenasDigitos } = await import("@/lib/documento-pessoa");
    const proprios = [prof.cpf, prof.cnpj].filter(Boolean).map((v) => apenasDigitos(v as string));
    if (!proprios.includes(repasse.titular_documento)) {
      return { ok: false as const, erro: "O titular da conta não corresponde ao CPF ou CNPJ do cadastro." };
    }
    const { data: atualizados, error } = await supabaseAdmin.from("professional_payout_destinations")
      .update({ conferido_em: new Date().toISOString(), conferido_por: context.userId })
      .eq("professional_id", data.id).eq("updated_at", repasse.updated_at)
      .select("professional_id");
    if (!error && !atualizados?.length) return { ok: false as const, erro: "Os dados foram alterados agora há pouco. Atualize a página e confira de novo." };
    if (error) return { ok: false as const, erro: "Não foi possível registrar a conferência." };
    const { writeAuditEvent } = await import("@/lib/audit.server");
    await writeAuditEvent({ actorId: context.userId, actorRole: "admin", action: "professional_registration_reviewed", entity: "professional_payout", entityId: data.id, metadata: { conferido: true } });
    return { ok: true as const };
  });
