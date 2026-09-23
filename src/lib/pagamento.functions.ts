import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { baseSegura } from "@/lib/origem-segura";
import { institucional } from "@/config/institucional";

/**
 * Cobrança da consulta: o paciente paga exatamente o preço definido pelo
 * profissional. A taxa fixa da plataforma é descontada do profissional no
 * split do provedor — nunca somada ao preço nem exibida ao paciente.
 */
export const iniciarPagamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { consultaId: string; origem: string }) => ({
    consultaId: String(data.consultaId),
    origem: String(data.origem),
  }))
  .handler(async ({ data, context }) => {
    if (!institucional.pagamentosAtivos) {
      return { ok: false as const, erro: "Os pagamentos estarão disponíveis após a formalização da empresa." };
    }
    const { supabase, userId } = context;
    const { data: consulta } = await supabase
      .from("appointments")
      .select(
        "id, inicio, patient_id, professional_id, status, payment_status, valor_centavos, taxa_plataforma_centavos, duracao_minutos, professionals(nome, slug)",
      )
      .eq("id", data.consultaId)
      .maybeSingle();

    if (!consulta || consulta.patient_id !== userId) {
      return { ok: false as const, erro: "Consulta não encontrada." };
    }
    if (consulta.payment_status === "aprovado") {
      return { ok: false as const, erro: "Esta consulta já está paga." };
    }

    const prof = consulta.professionals as { nome?: string; slug?: string } | null;
    const quando = new Date(consulta.inicio).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });
    const base = baseSegura(data.origem);

    const { provedorPagamento, tokenRecebedor } = await import("@/services/payments.server");
    const provedor = provedorPagamento();
    const recebedorToken = await tokenRecebedor(consulta.professional_id);

    const cobranca = await provedor.createCharge({
      referencia: consulta.id,
      valorCentavos: consulta.valor_centavos,
      taxaPlataformaCentavos: consulta.taxa_plataforma_centavos ?? 0,
      descricao: `Consulta online de ${consulta.duracao_minutos ?? 50} minutos com ${prof?.nome ?? "profissional"} em ${quando}`,
      metodos: ["cartao", "pix"],
      recebedorToken,
      urls: {
        sucesso: `${base}/painel?pagamento=aprovado`,
        pendente: `${base}/painel?pagamento=pendente`,
        falha: `${base}/painel?pagamento=recusado`,
        aviso: `${base}/api/public/webhooks/mercadopago`,
      },
    });

    if (!cobranca.ok) return { ok: false as const, erro: cobranca.erro };
    return { ok: true as const, link: cobranca.link, preferenciaId: cobranca.cobrancaId };
  });
