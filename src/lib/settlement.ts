export type SettlementOutcome = "REALIZADA" | "FALTA_PACIENTE" | "FALTA_PROFISSIONAL" | "CANCELADA_COM_ANTECEDENCIA" | "CANCELADA_TARDIA" | "FORCA_MAIOR";
export function capturePortions(outcome: SettlementOutcome): string[] {
  return outcome === "REALIZADA" ? ["A", "B"] : ["FALTA_PACIENTE", "CANCELADA_TARDIA"].includes(outcome) ? ["A"] : [];
}
export function attendanceOutcome(a: { attendance_status: string; patient_confirmed_at: string | null; professional_confirmed_at: string | null; attendance_decided_at: string | null; fim: string }, now = Date.now()): SettlementOutcome | null {
  if (new Date(a.fim).getTime() > now) return null;
  if (a.attendance_status === "realizada" && ((a.patient_confirmed_at && a.professional_confirmed_at) || a.attendance_decided_at)) return "REALIZADA";
  if (!a.attendance_decided_at) return null;
  return a.attendance_status === "falta_paciente" ? "FALTA_PACIENTE" : a.attendance_status === "falta_profissional" ? "FALTA_PROFISSIONAL" : null;
}
export function settlementLabel(status: string, captured: number) {
  if (status === "EXECUTADO") return captured > 0 ? "Cobrança concluída" : "Reserva liberada";
  if (status === "REVISAO" || status === "FALHOU") return "Cobrança em revisão";
  if (status === "PROCESSANDO") return "Cobrança em processamento";
  return "Cobrança pendente";
}

export type Portion = { id: string; portion: string; amount_centavos: number; platform_amount_centavos: number; professional_amount_centavos: number; provider_payment_id: string; reference: string };
export type ProviderPayment = { id: string; status: string; value: number; externalReference?: string | null };
export type SettlementPorts = {
  get: (id: string) => Promise<ProviderPayment>;
  capture: (id: string) => Promise<unknown>;
  cancel: (id: string) => Promise<unknown>;
  refund: (id: string) => Promise<unknown>;
  save: (portion: Portion, payment: ProviderPayment) => Promise<void>;
  lease: () => Promise<void>;
};
export class SettlementReview extends Error {}
const capturedStates = ["CONFIRMED", "RECEIVED"];
const canceledStates = ["DELETED", "CANCELLED", "REFUNDED"];
export async function reconcileSettlement(portions: Portion[], outcome: SettlementOutcome, ports: SettlementPorts) {
  if (portions.length !== 2 || !["A", "B"].every(p => portions.filter(a => a.portion === p).length === 1)) throw new SettlementReview("PORTIONS_INVALID");
  const captures = capturePortions(outcome);
  // Preflight every portion before any financial mutation.
  for (const a of portions) {
    const p = await ports.get(a.provider_payment_id);
    if (p.id !== a.provider_payment_id || Math.round(p.value * 100) !== a.amount_centavos || p.externalReference !== a.reference || a.professional_amount_centavos + a.platform_amount_centavos !== a.amount_centavos) throw new SettlementReview("PAYMENT_MISMATCH");
    if (captures.includes(a.portion) && !["AUTHORIZED", ...capturedStates].includes(p.status)) throw new SettlementReview("AUTHORIZATION_UNAVAILABLE");
    if (!captures.includes(a.portion) && !["AUTHORIZED", ...capturedStates, ...canceledStates].includes(p.status)) throw new SettlementReview("RELEASE_REQUIRES_REVIEW");
  }
  let captured = 0, platform = 0, professional = 0;
  for (const a of portions) {
    await ports.lease();
    let p = await ports.get(a.provider_payment_id);
    if (captures.includes(a.portion)) {
      if (!capturedStates.includes(p.status)) {
        if (p.status !== "AUTHORIZED") throw new SettlementReview("AUTHORIZATION_UNAVAILABLE");
        await ports.capture(p.id);
      }
      p = await ports.get(p.id);
      if (!capturedStates.includes(p.status)) throw new Error("CAPTURE_NOT_RECONCILED");
      captured += a.amount_centavos; platform += a.platform_amount_centavos; professional += a.professional_amount_centavos;
    } else {
      if (capturedStates.includes(p.status)) await ports.refund(p.id);
      else if (p.status === "AUTHORIZED") await ports.cancel(p.id);
      p = await ports.get(p.id);
      if (!canceledStates.includes(p.status)) throw new Error("RELEASE_NOT_RECONCILED");
    }
    await ports.save(a, p);
  }
  return { captured, platform, professional };
}