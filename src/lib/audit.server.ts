import { getRequest } from "@tanstack/react-start/server";

type AuditAction =
  | "login"
  | "logout"
  | "appointment_status_changed"
  | "credential_document_accessed"
  | "professional_registration_reviewed"
  | "profile_data_changed"
  | "payment_authorized"
  | "payment_captured"
  | "payment_authorization_canceled"
  | "payment_refunded"
  | "payment_failed";
  | "asaas_sandbox_subaccount_created"
  | "asaas_sandbox_authorizations_created"
  | "asaas_sandbox_refresh"
  | "asaas_sandbox_capture"
  | "asaas_sandbox_cancel";

type AuditRole = "paciente" | "profissional" | "admin" | "sistema" | "anonimo";

export async function writeAuditEvent(event: {
  actorId?: string | null;
  actorRole: AuditRole;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean | null | string[]>;
}) {
  const request = getRequest();
  const ip = request?.headers.get("cf-connecting-ip")
    ?? request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("audit_log").insert({
    actor_id: event.actorId ?? null,
    actor_role: event.actorRole,
    action: event.action,
    entity: event.entity,
    entity_id: event.entityId ?? null,
    metadata: event.metadata ?? {},
    ip,
  });
  if (error) console.error("Falha ao registrar evento de auditoria", { action: event.action });
}