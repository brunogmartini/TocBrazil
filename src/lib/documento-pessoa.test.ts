import { describe, expect, it } from "vitest";
import { cpfValido, cnpjValido, formatarCpf, formatarCnpj } from "./documento-pessoa";

describe("identificação profissional PF/PJ", () => {
  it("verifica CPF e rejeita dígitos incorretos ou repetidos", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("529.982.247-26")).toBe(false);
    expect(cpfValido("11111111111")).toBe(false);
  });
  it("verifica CNPJ e rejeita dígitos incorretos ou repetidos", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
  });
  it("formata documentos sem perder os dígitos", () => {
    expect(formatarCpf("52998224725")).toBe("529.982.247-25");
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});