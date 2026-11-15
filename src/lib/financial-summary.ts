export type FinancialSituation = "agendada" | "a_receber" | "pago" | "cancelada" | "nao_compareceu" | "aguardando_pagamento" | "expirada" | "remarcada" | "em_analise";
export function financialSituation(c: { status: string; payment_status: string; attendance_status: string }, paidOut = false): FinancialSituation {
  if (c.status === "cancelada") return "cancelada";
  if (c.status === "expirado") return "expirada";
  if (c.status === "remarcada") return "remarcada";
  if (c.payment_status !== "aprovado") return "aguardando_pagamento";
  if (c.attendance_status === "em_analise") return "em_analise";
  if (["falta_paciente", "falta_profissional"].includes(c.attendance_status) || c.status === "nao_compareceu") return "nao_compareceu";
  if (c.attendance_status === "realizada" || c.status === "realizada") return paidOut ? "pago" : "a_receber";
  return "agendada";
}