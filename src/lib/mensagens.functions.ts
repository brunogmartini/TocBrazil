import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MensagemAdministrativa = {
  id: string;
  corpo: string;
  autor_papel: "paciente" | "profissional";
  autor_id: string;
  created_at: string;
};

/** Confere se quem chama participa da consulta e devolve o papel dele. */
async function papelNaConsulta(
  supabase: any,
  userId: string,
  appointmentId: string,
): Promise<"paciente" | "profissional" | null> {
  const { data } = await supabase
    .from("appointments")
    .select("patient_id, professionals(user_id)")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!data) return null;
  if (data.patient_id === userId) return "paciente";
  const prof = data.professionals as { user_id?: string } | null;
  if (prof?.user_id === userId) return "profissional";
  return null;
}

export const listarMensagens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { consultaId: string }) => ({ consultaId: String(data.consultaId) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const papel = await papelNaConsulta(supabase, userId, data.consultaId);
    if (!papel) return { mensagens: [] as MensagemAdministrativa[], papel: null };

    const { data: linhas, error } = await supabase
      .from("appointment_messages")
      .select("id, corpo, autor_papel, autor_id, created_at")
      .eq("appointment_id", data.consultaId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    // marca como lidas as mensagens da outra parte
    const naoLidas = (linhas ?? []).filter((m: any) => m.autor_papel !== papel).map((m: any) => m.id);
    if (naoLidas.length) {
      await supabase
        .from("appointment_messages")
        .update({ lida_em: new Date().toISOString() })
        .in("id", naoLidas)
        .is("lida_em", null);
    }

    return { mensagens: (linhas ?? []) as MensagemAdministrativa[], papel };
  });

export const enviarMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { consultaId: string; corpo: string }) => ({
    consultaId: String(data.consultaId),
    corpo: String(data.corpo).trim().slice(0, 1000),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.corpo) return { ok: false as const, erro: "Escreva a mensagem." };
    const papel = await papelNaConsulta(supabase, userId, data.consultaId);
    if (!papel) return { ok: false as const, erro: "Consulta não encontrada." };

    const { error } = await supabase.from("appointment_messages").insert({
      appointment_id: data.consultaId,
      autor_id: userId,
      autor_papel: papel,
      corpo: data.corpo,
    });
    if (error) return { ok: false as const, erro: error.message };
    return { ok: true as const };
  });
