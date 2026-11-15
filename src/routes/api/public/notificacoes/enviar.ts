import { createFileRoute } from "@tanstack/react-router";

/**
 * Disparo dos avisos de pagamento aprovado, lembretes de 24h e de 30 minutos e dos
 * avisos de vencimento de certidão e apólice (30, 15 e 7 dias).
 * Chamado pela tarefa agendada do banco, autenticada por token interno.
 */
async function autenticar(request: Request, supabaseAdmin: any) {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (!token) return false;
  const { data } = await supabaseAdmin.rpc("cron_token_valido", {
    _nome: "notificacoes",
    _token: token,
  });
  return data === true;
}


async function processar(request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await autenticar(request, supabaseAdmin))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  const { deliverAppointmentNotice } = await import("@/services/appointment-email.server");

  const agora = new Date();
  let lembretes = 0;
  let avisos = 0;

  /* ---------- lembretes de consulta ---------- */
  const { data: pendentes } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, appointment_id, tipo")
    .eq("canal", "email")
    .is("enviada_em", null)
    .in("tipo", ["consulta_confirmada_profissional", "lembrete_24h", "lembrete_30min"])
    .lte("agendada_para", agora.toISOString())
    .order("agendada_para", { ascending: false })
    .limit(50);

  for (const n of pendentes ?? []) {
    try {
      if (await deliverAppointmentNotice(supabaseAdmin, n, agora.getTime())) lembretes += 1;
    } catch {
      console.error("falha ao enviar aviso de consulta", { notificationId: n.id });
      // Stop this batch when sending fails (including rate limits); retry on the next scheduled call.
      return Response.json({ lembretes, avisos, pendente: true }, { status: 503 });
    }
  }

  /* ---------- avisos de vencimento de documentos ---------- */
  const DIAS = [30, 15, 7];
  const hoje = new Date(agora.toISOString().slice(0, 10));
  const alvos = DIAS.map((d) => {
    const data = new Date(hoje);
    data.setDate(data.getDate() + d);
    return { dias: d, dia: data.toISOString().slice(0, 10) };
  });

  const { data: profissionais } = await supabaseAdmin
    .from("professionals")
    .select("id, nome, email_contato, certidao_validade, apolice_validade")
    .in("status", ["aprovado", "pendente"]);

  for (const p of profissionais ?? []) {
    const email = p.email_contato as string | null;
    if (!email) continue;
    for (const alvo of alvos) {
      const itens: Array<{ documento: string; validade: string | null }> = [
        { documento: "certidão de regularidade do conselho", validade: p.certidao_validade },
        { documento: "apólice de seguro", validade: p.apolice_validade },
      ];
      for (const item of itens) {
        if (item.validade !== alvo.dia) continue;
        try {
          await sendTemplateEmail("documento-vencendo", email, {
            templateData: {
              nomeProfissional: p.nome?.split(" ")[0] ?? null,
              documento: item.documento,
              validade: new Date(`${item.validade}T12:00:00Z`).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              }),
              diasRestantes: alvo.dias,
            },
            // Um aviso por documento, prazo e data de validade.
            idempotencyKey: `vencimento-${p.id}-${item.documento}-${item.validade}-${alvo.dias}`,
          });
          avisos += 1;
        } catch (erro) {
          console.error("falha ao avisar vencimento", p.id, erro);
        }
      }
    }
  }

  return Response.json({ lembretes, avisos });
}

export const Route = createFileRoute("/api/public/notificacoes/enviar")({
  server: {
    handlers: {
      POST: async ({ request }) => processar(request),
      GET: async ({ request }) => processar(request),
    },
  },
});
