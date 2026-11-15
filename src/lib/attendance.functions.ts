import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validMeetingUrl } from "@/lib/attendance";

const appointment = z.object({ id: z.string().uuid() });
export const appointmentRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => appointment.parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("appointment_room_access", { _appointment_id: data.id });
    if (error) throw new Error("Não foi possível consultar a sala agora.");
    return rows?.[0] ?? null;
  });

export const saveAppointmentRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; url: string }) => appointment.extend({ url: z.string().trim().refine(validMeetingUrl, "Informe uma URL HTTPS válida.") }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("appointment_room_update", { _appointment_id: data.id, _url: data.url });
    return error ? { ok: false as const, erro: "Não foi possível salvar. Informe um link HTTPS válido antes do início da consulta." } : { ok: true as const };
  });

export const confirmAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; side: "paciente" | "profissional" }) => appointment.extend({ side: z.enum(["paciente", "profissional"]) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("appointment_attendance_confirm", { _appointment_id: data.id, _side: data.side });
    return error ? { ok: false as const, erro: "Confirme após o término, até 48 horas depois, em uma consulta paga e ainda sem decisão final." } : { ok: true as const };
  });

export const attendanceReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("appointment_attendance_reviews");
    if (error) throw new Error("Não foi possível carregar a análise de presença.");
    const rows = data ?? [];
    const { data: reports, error: reportsError } = rows.length ? await context.supabase.from("appointment_attendance_reports").select("appointment_id,side,reason,created_at").in("appointment_id", rows.map(r => r.id)) : { data: [], error: null };
    if (reportsError) throw new Error("Não foi possível carregar os motivos administrativos.");
    return rows.map(row => ({ ...row, reports: (reports ?? []).filter(r => r.appointment_id === row.id) }));
  });

export type AttendanceDetails = { fim: string; payment_status: string; automatic_at: string | null; decided_at: string | null; reports: { side: string; reason: string; created_at: string }[] };
export const attendanceDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => appointment.parse(data))
  .handler(async ({ data, context }): Promise<AttendanceDetails> => {
    const { data: result, error } = await context.supabase.rpc("appointment_attendance_details", { _appointment_id: data.id });
    if (error) throw new Error("Não foi possível conferir a presença.");
    return z.object({ fim: z.string(), payment_status: z.string(), automatic_at: z.string().nullable(), decided_at: z.string().nullable(), reports: z.array(z.object({ side: z.string(), reason: z.string(), created_at: z.string() })) }).parse(result);
  });
export const reportAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; side: "paciente" | "profissional"; reason: string }) => appointment.extend({ side: z.enum(["paciente", "profissional"]), reason: z.string().trim().min(3).max(1000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("appointment_attendance_report", { _appointment_id: data.id, _side: data.side, _reason: data.reason });
    return error ? { ok: false as const, erro: "Não foi possível registrar. Confira o prazo de 48 horas, o pagamento e se você já enviou um motivo." } : { ok: true as const };
  });

export const decideAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "realizada" | "falta_paciente" | "falta_profissional"; justification: string; observation: string }) => appointment.extend({ status: z.enum(["realizada", "falta_paciente", "falta_profissional"]), justification: z.string().trim().min(3).max(2000), observation: z.string().trim().max(2000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("appointment_attendance_decide", { _appointment_id: data.id, _status: data.status, _justification: data.justification, _observation: data.observation });
    return error ? { ok: false as const, erro: "Não foi possível registrar a decisão. Verifique a justificativa e se a consulta ainda está em análise." } : { ok: true as const };
  });