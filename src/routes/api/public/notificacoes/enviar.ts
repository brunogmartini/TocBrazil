import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Disparo dos e-mails já programados (lembretes de 24h e de 15 minutos) e dos
 * avisos de vencimento de certidão e apólice (30, 15 e 7 dias).
 * Chamado por tarefa agendada — autenticado pelo segredo de cron.
 */
async function processar(request: Request) {
  const negado = await authenticateCronRequest(request);
  if (negado) return negado;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

  const agora = new Date();
  let lembretes = 0;
  let avisos = 0;

  const formatar = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });

  /* ---------- lembretes de consulta ---------- */
  const { data: pendentes } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, appointment_id, tipo")
    .eq("canal", "email")
    .is("enviada_em", null)
    .in("tipo", ["lembrete_24h", "lembrete_15min"])
    .lte("agendada_para", agora.toISOString())
    .limit(50);

  for (const n of pendentes ?? []) {
    try {
      const [{ data: paciente }, { data: consulta }] = await Promise.all([
        supabaseAdmin.from("profiles").select("nome, email").eq("id", n.user_id).maybeSingle(),
        n.appointment_id
          ? supabaseAdmin
              .from("appointments")
              .select("inicio, status, professionals(nome)")
              .eq("id", n.appointment_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const cancelada =
        !consulta || !["confirmada", "aguardando_pagamento"].includes(String(consulta.status));

      if (paciente?.email && !cancelada) {
        const prof = consulta.professionals as { nome?: string } | null;
        await sendTemplateEmail("lembrete-consulta", paciente.email, {
          templateData: {
            nomePaciente: paciente.nome?.split(" ")[0] ?? null,
            nomeProfissional: prof?.nome ?? "seu profissional",
            quando: formatar(consulta.inicio),
            emBreve: n.tipo === "lembrete_15min",
          },
          idempotencyKey: `${n.tipo}-${n.id}`,
        });
        lembretes += 1;
      }
      await supabaseAdmin
        .from("notifications")
        .update({ enviada_em: new Date().toISOString() })
        .eq("id", n.id);
    } catch (erro) {
      console.error("falha ao enviar lembrete", n.id, erro);
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
    .select("id, nome, email_contato, user_id, certidao_validade, apolice_validade")
    .in("status", ["aprovado", "pendente"]);

  for (const p of profissionais ?? []) {
    const email = p.email_contato;
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
