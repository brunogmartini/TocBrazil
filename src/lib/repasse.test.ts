import { describe, expect, it } from "vitest";
import { validarDadosRepasse } from "./repasse";

const CPF = "52998224725";
const CNPJ = "11222333000181";
const prof = { cpf: CPF, cnpj: null };

describe("dados para repasse", () => {
  it("aceita Pix com chave CPF do próprio profissional", () => {
    const r = validarDadosRepasse({ metodo: "pix", pixTipo: "cpf", pixChave: "529.982.247-25", titularNome: "Ana Souza", titularDocumento: CPF }, prof);
    expect(r).toMatchObject({ ok: true, dados: { pix_chave: CPF, titular_documento: CPF } });
  });

  it("recusa conta de outra pessoa", () => {
    const r = validarDadosRepasse({ metodo: "pix", pixTipo: "email", pixChave: "a@b.com", titularNome: "Outra Pessoa", titularDocumento: "11144477735" }, prof);
    expect(r.ok).toBe(false);
  });

  it("aceita titular pelo CNPJ da empresa do profissional", () => {
    const r = validarDadosRepasse({ metodo: "pix", pixTipo: "cnpj", pixChave: CNPJ, titularNome: "Clínica Ana", titularDocumento: CNPJ }, { cpf: CPF, cnpj: CNPJ });
    expect(r.ok).toBe(true);
  });

  it("recusa chave Pix CPF inválida", () => {
    const r = validarDadosRepasse({ metodo: "pix", pixTipo: "cpf", pixChave: "12345678900", titularNome: "Ana Souza", titularDocumento: CPF }, prof);
    expect(r.ok).toBe(false);
  });

  it("normaliza celular com +55", () => {
    const r = validarDadosRepasse({ metodo: "pix", pixTipo: "telefone", pixChave: "(51) 99999-8888", titularNome: "Ana Souza", titularDocumento: CPF }, prof);
    expect(r).toMatchObject({ ok: true, dados: { pix_chave: "+5551999998888" } });
  });

  it("aceita conta bancária completa e formata o dígito", () => {
    const r = validarDadosRepasse({ metodo: "banco", bancoCodigo: "001", agencia: "1234", conta: "56789-0", tipoConta: "corrente", titularNome: "Ana Souza", titularDocumento: CPF }, prof);
    expect(r).toMatchObject({ ok: true, dados: { banco_codigo: "001", agencia: "1234", conta: "56789-0" } });
  });

  it("recusa banco com código incompleto", () => {
    const r = validarDadosRepasse({ metodo: "banco", bancoCodigo: "1", agencia: "1234", conta: "56789-0", tipoConta: "corrente", titularNome: "Ana Souza", titularDocumento: CPF }, prof);
    expect(r.ok).toBe(false);
  });
});
