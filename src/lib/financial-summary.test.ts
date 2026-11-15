import { describe, expect, it } from "vitest";
import { financialSituation } from "./financial-summary";
describe("professional earnings", () => {
  it("seven unpaid expired reservations contribute zero and the one paid performed consultation contributes 17300 to receivable", () => {
    const rows = [...Array.from({ length: 7 }, () => ({ status: "expirado", payment_status: "pendente", attendance_status: "agendada" })), { status: "confirmada", payment_status: "aprovado", attendance_status: "realizada" }];
    expect(rows.filter(c => financialSituation(c) === "agendada").length).toBe(0);
    expect(rows.filter(c => financialSituation(c) === "a_receber").length * 17300).toBe(17300);
  });
  it("even confirmed reservations require patient payment", () => expect(financialSituation({ status: "confirmada", payment_status: "pendente", attendance_status: "agendada" })).toBe("aguardando_pagamento"));
  it("patient payment is not a professional payout", () => {
    const c = { status: "confirmada", payment_status: "aprovado", attendance_status: "realizada" };
    expect(financialSituation(c, false)).toBe("a_receber"); expect(financialSituation(c, true)).toBe("pago");
  });
  it("disputed appointments do not count as future or receivable", () => expect(financialSituation({ status: "confirmada", payment_status: "aprovado", attendance_status: "em_analise" })).toBe("em_analise"));
});