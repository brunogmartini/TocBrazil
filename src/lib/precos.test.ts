import { describe, expect, it } from "vitest";
import { TAXA_FIXA_CENTAVOS, valorProfissionalCentavos } from "@/lib/precos";

describe("valor da consulta", () => {
  it("mantém R$ 180 como preço público e deduz R$ 27 do profissional", () => {
    expect(TAXA_FIXA_CENTAVOS).toBe(2700);
    expect(valorProfissionalCentavos(18000)).toBe(15300);
  });

  it("nunca produz valor negativo para o profissional", () => {
    expect(valorProfissionalCentavos(2700)).toBe(0);
  });
});