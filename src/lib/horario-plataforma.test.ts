import { describe, it, expect } from "vitest";
import { limitarFaixa } from "./horario-plataforma";
describe("janela de agendamento", () => {
  it("domingo não aceita consultas", () => expect(limitarFaixa(0, "08:00", "18:00")).toBeNull());
  it("dia útil limitado a 8h–18h", () => expect(limitarFaixa(3, "06:00", "21:00")).toEqual({ inicio: "08:00", fim: "18:00" }));
  it("sábado limitado a 8h–11h", () => expect(limitarFaixa(6, "07:00", "15:00")).toEqual({ inicio: "08:00", fim: "11:00" }));
  it("faixa menor escolhida pelo psicólogo é mantida", () => expect(limitarFaixa(2, "09:00", "12:00")).toEqual({ inicio: "09:00", fim: "12:00" }));
  it("faixa fora da janela é descartada", () => expect(limitarFaixa(6, "12:00", "14:00")).toBeNull());
});
