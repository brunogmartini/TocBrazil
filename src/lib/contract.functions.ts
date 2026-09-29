import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTRACT_DECLARATIONS, CONTRACT_SIGNATURE_NOTICE, CONTRACT_SUMMARY, CONTRACT_VERSION, REQUIRED_ANNEX_KEYS } from "@/lib/contract-content";

const documentKeySchema = z.enum(["contract", "annex_i", "annex_iii", "annex_iv", "annex_v"]);

function requestMetadata() {
  const request = getRequest();
  const rawIp = request?.headers.get("cf-connecting-ip") ?? request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return {
    ip: rawIp && /^[0-9a-f:.]+$/i.test(rawIp) ? rawIp : null,
    userAgent: request?.headers.get("user-agent")?.slice(0, 500) ?? null,
    country: request?.headers.get("cf-ipcountry")?.slice(0, 80) ?? null,
    region: request?.headers.get("cf-region")?.slice(0, 120) ?? null,
    city: request?.headers.get("cf-ipcity")?.slice(0, 120) ?? null,
  };
}

export const publicContractDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: documents } = await supabaseAdmin.from("contract_documents")
    .select("document_key, display_name, sha256, storage_path, display_order, contract_version")
    .eq("active", true).order("display_order");
  const rows = documents ?? [];
  const signed = await Promise.all(rows.map(async (document) => {
    const { data } = await supabaseAdmin.storage.from("contratos-profissionais").createSignedUrl(document.storage_path, 600);
    return { key: document.document_key, name: document.display_name, sha256: document.sha256, version: document.contract_version, url: data?.signedUrl ?? null };
  }));
  return { version: CONTRACT_VERSION, summary: CONTRACT_SUMMARY, documents: signed };
});

export const professionalContractState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: professional } = await context.supabase.from("professionals")
      .select("id, nome, cpf, registro, uf, cadastro_conferido_em")
      .eq("user_id", context.userId).maybeSingle();
    if (!professional) return { available: false as const, reason: "no_registration" as const };
    if (!professional.cadastro_conferido_em) return { available: false as const, reason: "under_review" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: documents }, { data: accesses }, { data: acceptance }, { data: account }] = await Promise.all([
      supabaseAdmin.from("contract_documents").select("document_key, display_name, sha256, storage_path, display_order, contract_version").eq("active", true).order("display_order"),
      supabaseAdmin.from("document_accesses").select("document_key, accessed_at").eq("user_id", context.userId).eq("contract_version", CONTRACT_VERSION),
      supabaseAdmin.from("document_acceptances").select("id, accepted_at, evidence_sha256").eq("user_id", context.userId).eq("contract_version", CONTRACT_VERSION).maybeSingle(),
      supabaseAdmin.from("asaas_professional_accounts").select("status, wallet_id").eq("professional_id", professional.id).eq("environment", "sandbox").maybeSingle(),
    ]);
    const signed = await Promise.all((documents ?? []).map(async (document) => {
      const { data } = await supabaseAdmin.storage.from("contratos-profissionais").createSignedUrl(document.storage_path, 600);
      return { key: document.document_key, name: document.display_name, sha256: document.sha256, version: document.contract_version, url: data?.signedUrl ?? null };
    }));
    return {
      available: true as const,
      professionalId: professional.id,
      identity: { name: professional.nome, cpf: professional.cpf ?? "", crp: professional.registro, uf: professional.uf },
      version: CONTRACT_VERSION,
      summary: CONTRACT_SUMMARY,
      declarations: [...CONTRACT_DECLARATIONS],
      signatureNotice: CONTRACT_SIGNATURE_NOTICE,
      documents: signed,
      openedAnnexes: (accesses ?? []).map((row) => row.document_key),
      acceptance: acceptance ?? null,
      receivingActive: Boolean(account?.wallet_id && account.status === "ativa"),
    };
  });

export const recordContractDocumentAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ documentKey: documentKeySchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: professional } = await context.supabase.from("professionals").select("id, cadastro_conferido_em").eq("user_id", context.userId).maybeSingle();
    if (!professional?.cadastro_conferido_em) return { ok: false as const, error: "Documentos em análise." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: document } = await supabaseAdmin.from("contract_documents").select("sha256").eq("active", true).eq("contract_version", CONTRACT_VERSION).eq("document_key", data.documentKey).maybeSingle();
    if (!document) return { ok: false as const, error: "Documento indisponível." };
    const metadata = requestMetadata();
    const { error } = await supabaseAdmin.from("document_accesses").insert({ user_id: context.userId, professional_id: professional.id, contract_version: CONTRACT_VERSION, document_key: data.documentKey, document_sha256: document.sha256, ip: metadata.ip, user_agent: metadata.userAgent });
    if (error && error.code !== "23505") return { ok: false as const, error: "Não foi possível registrar a leitura." };
    return { ok: true as const };
  });

export const acceptProfessionalContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ scrollCompleted: z.literal(true), declarations: z.array(z.boolean()).length(7) }).parse(input))
  .handler(async ({ data, context }) => {
    if (!data.declarations.every(Boolean)) return { ok: false as const, error: "Confirme cada declaração individualmente." };
    const { data: professional } = await context.supabase.from("professionals").select("id, nome, cpf, registro, uf, cadastro_conferido_em").eq("user_id", context.userId).maybeSingle();
    if (!professional?.cadastro_conferido_em) return { ok: false as const, error: "Seu cadastro ainda está em conferência." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: documents }, { data: accesses }, { data: existing }] = await Promise.all([
      supabaseAdmin.from("contract_documents").select("document_key, sha256").eq("active", true).eq("contract_version", CONTRACT_VERSION),
      supabaseAdmin.from("document_accesses").select("document_key").eq("user_id", context.userId).eq("contract_version", CONTRACT_VERSION),
      supabaseAdmin.from("document_acceptances").select("id").eq("user_id", context.userId).eq("contract_version", CONTRACT_VERSION).maybeSingle(),
    ]);
    if (existing) return { ok: false as const, error: "Esta versão já foi aceita." };
    const opened = new Set((accesses ?? []).map((row) => row.document_key));
    if (!REQUIRED_ANNEX_KEYS.every((key) => opened.has(key))) return { ok: false as const, error: "Abra os quatro anexos antes de aceitar." };
    const contract = (documents ?? []).find((row) => row.document_key === "contract");
    if (!contract) return { ok: false as const, error: "Contrato indisponível." };
    const annexHashes = Object.fromEntries((documents ?? []).filter((row) => row.document_key !== "contract").map((row) => [row.document_key, row.sha256]));
    const acceptedAt = new Date().toISOString();
    const metadata = requestMetadata();
    const evidence = createHash("sha256").update(JSON.stringify({ userId: context.userId, professionalId: professional.id, version: CONTRACT_VERSION, contract: contract.sha256, annexes: annexHashes, declarations: [...CONTRACT_DECLARATIONS], acceptedAt })).digest("hex");
    const { error } = await supabaseAdmin.from("document_acceptances").insert({
      user_id: context.userId, professional_id: professional.id, contract_version: CONTRACT_VERSION, contract_sha256: contract.sha256,
      accepted_at: acceptedAt, scroll_completed_at: acceptedAt, declarations: [...CONTRACT_DECLARATIONS], annex_hashes: annexHashes,
      ip: metadata.ip, user_agent: metadata.userAgent, geo_country: metadata.country, geo_region: metadata.region, geo_city: metadata.city, evidence_sha256: evidence,
    });
    if (error) return { ok: false as const, error: "Não foi possível registrar o aceite agora." };
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, actor_role: "profissional", action: "professional_contract_accepted", entity: "professional", entity_id: professional.id, metadata: { version: CONTRACT_VERSION, document_keys: (documents ?? []).map((row) => row.document_key) } });
    return { ok: true as const, acceptedAt };
  });