/**
 * Camada de pagamentos com o provedor abstraído.
 *
 * Regras da plataforma:
 * - O paciente paga exatamente o preço definido pelo profissional.
 * - A taxa fixa da plataforma é cobrada do profissional (split), nunca somada ao preço.
 * - O dinheiro do profissional não transita por conta da plataforma: a cobrança é
 *   liquidada na conta de recebimento dele no provedor.
 * - Não existe carteira, saldo interno nem transferência manual de valores.
 */

export type MetodoPagamento = "cartao" | "pix";

export type StatusCobranca = "pendente" | "aprovado" | "recusado" | "estornado" | "cancelado";

export type DadosCobranca = {
  /** Identificador da consulta (external reference no provedor). */
  referencia: string;
  /** Preço do profissional, em centavos — é o que o paciente paga. */
  valorCentavos: number;
  /** Taxa fixa da plataforma, em centavos, descontada do profissional. */
  taxaPlataformaCentavos: number;
  descricao: string;
  metodos?: MetodoPagamento[];
  /** Conta de recebimento do profissional no provedor, quando já vinculada. */
  recebedorToken?: string | null;
  urls: { sucesso: string; pendente: string; falha: string; aviso: string };
};

export type Cobranca = {
  ok: true;
  provedor: string;
  cobrancaId: string;
  link: string;
};

export type FalhaPagamento = { ok: false; erro: string };

export type ProvedorPagamento = {
  nome: string;
  createCharge(dados: DadosCobranca): Promise<Cobranca | FalhaPagamento>;
  confirmCharge(cobrancaId: string): Promise<{ status: StatusCobranca; referencia?: string | null }>;
  refund(cobrancaId: string, valorCentavos?: number): Promise<{ ok: boolean; erro?: string }>;
  /** Registra/consulta a conta de recebimento do profissional (split). */
  registerReceiver(dados: {
    professionalId: string;
    contaId: string;
    accessToken: string;
  }): Promise<{ ok: boolean; erro?: string }>;
};

/* ---------- Mercado Pago ---------- */

const API = "https://api.mercadopago.com";

const MAPA_STATUS: Record<string, StatusCobranca> = {
  approved: "aprovado",
  authorized: "aprovado",
  pending: "pendente",
  in_process: "pendente",
  in_mediation: "pendente",
  rejected: "recusado",
  cancelled: "cancelado",
  refunded: "estornado",
  charged_back: "estornado",
};

function mercadoPago(tokenPlataforma: string): ProvedorPagamento {
  return {
    nome: "mercadopago",

    async createCharge(dados) {
      // Split: a cobrança é criada com o token do profissional (recebedor) e a
      // taxa fixa da plataforma vai em marketplace_fee.
      const usaSplit = Boolean(dados.recebedorToken);
      const token = dados.recebedorToken ?? tokenPlataforma;
      const corpo: Record<string, unknown> = {
        external_reference: dados.referencia,
        statement_descriptor: "TOCBRAZIL",
        items: [
          {
            id: dados.referencia,
            title: dados.descricao,
            quantity: 1,
            currency_id: "BRL",
            unit_price: dados.valorCentavos / 100,
          },
        ],
        back_urls: {
          success: dados.urls.sucesso,
          pending: dados.urls.pendente,
          failure: dados.urls.falha,
        },
        auto_return: "approved",
        notification_url: dados.urls.aviso,
        payment_methods: {
          excluded_payment_types: (dados.metodos ?? ["cartao", "pix"]).includes("cartao")
            ? []
            : [{ id: "credit_card" }, { id: "debit_card" }],
        },
      };
      if (usaSplit) corpo["marketplace_fee"] = dados.taxaPlataformaCentavos / 100;

      const resposta = await fetch(`${API}/checkout/preferences`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!resposta.ok) return { ok: false, erro: "Não foi possível abrir o pagamento agora." };
      const pref = (await resposta.json()) as {
        id: string;
        init_point?: string;
        sandbox_init_point?: string;
      };
      const link = pref.init_point ?? pref.sandbox_init_point;
      if (!link) return { ok: false, erro: "Não foi possível abrir o pagamento agora." };
      return { ok: true, provedor: "mercadopago", cobrancaId: pref.id, link };
    },

    async confirmCharge(cobrancaId) {
      const resposta = await fetch(`${API}/v1/payments/${cobrancaId}`, {
        headers: { Authorization: `Bearer ${tokenPlataforma}` },
      });
      if (!resposta.ok) return { status: "pendente" };
      const pg = (await resposta.json()) as { status: string; external_reference?: string };
      return { status: MAPA_STATUS[pg.status] ?? "pendente", referencia: pg.external_reference ?? null };
    },

    async refund(cobrancaId, valorCentavos) {
      const resposta = await fetch(`${API}/v1/payments/${cobrancaId}/refunds`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenPlataforma}`, "Content-Type": "application/json" },
        body: JSON.stringify(valorCentavos ? { amount: valorCentavos / 100 } : {}),
      });
      if (!resposta.ok) return { ok: false, erro: "Estorno não concluído pelo provedor." };
      return { ok: true };
    },

    async registerReceiver({ professionalId, contaId, accessToken }) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("mercadopago_contas").upsert({
        professional_id: professionalId,
        mp_user_id: contaId,
        access_token: accessToken,
      });
      return error ? { ok: false, erro: "Conta de recebimento não registrada." } : { ok: true };
    },
  };
}

/* ---------- Mock (usado quando não há provedor configurado) ---------- */

function provedorMock(): ProvedorPagamento {
  return {
    nome: "mock",
    async createCharge(dados) {
      return {
        ok: true,
        provedor: "mock",
        cobrancaId: `mock-${dados.referencia}`,
        link: `${dados.urls.sucesso}&simulado=1`,
      };
    },
    async confirmCharge() {
      return { status: "aprovado" };
    },
    async refund() {
      return { ok: true };
    },
    async registerReceiver() {
      return { ok: true };
    },
  };
}

/** Provedor ativo: Mercado Pago quando configurado, mock caso contrário. */
export function provedorPagamento(): ProvedorPagamento {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  return token ? mercadoPago(token) : provedorMock();
}

/** Conta de recebimento do profissional, quando já vinculada (split). */
export async function tokenRecebedor(professionalId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("mercadopago_contas")
    .select("access_token")
    .eq("professional_id", professionalId)
    .maybeSingle();
  return data?.access_token ?? null;
}
