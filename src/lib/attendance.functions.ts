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
    return error ? { ok: false as const, erro: "A confirmação está disponível apenas do início até 24 horas depois, para os participantes da consulta." } : { ok: true as const };
  });

export const attendanceReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("appointment_attendance_reviews");
    if (error) throw new Error("Não foi possível carregar a análise de presença.");
    return data ?? [];
  });

export const decideAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "realizada" | "falta_paciente" | "falta_profissional"; justification: string; observation: string }) => appointment.extend({ status: z.enum(["realizada", "falta_paciente", "falta_profissional"]), justification: z.string().trim().min(3).max(2000), observation: z.string().trim().max(2000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("appointment_attendance_decide", { _appointment_id: data.id, _status: data.status, _justification: data.justification, _observation: data.observation });
    return error ? { ok: false as const, erro: "Não foi possível registrar a decisão. Verifique a justificativa e se a consulta ainda está em análise." } : { ok: true as const };
  });