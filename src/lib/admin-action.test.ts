import { describe, expect, it } from "vitest";
import { executarAcaoAdmin } from "./admin-action";

describe("resultado das ações administrativas", () => {
  it("preserva a recusa da conferência sem tratá-la como aprovação", async () => {
    const erro = "O perfil público ainda está incompleto ou a foto não foi aprovada.";
    expect(await executarAcaoAdmin(async () => ({ ok: false, erro }), "Aprovado")).toEqual({ ok: false, mensagem: erro });
  });
  it("retorna sucesso apenas quando a ação confirma sucesso", async () => {
    expect(await executarAcaoAdmin(async () => ({ ok: true }), "Concluído")).toEqual({ ok: true, mensagem: "Concluído" });
  });
  it("trata falhas de sessão ou rede como falha", async () => {
    const resultado = await executarAcaoAdmin(async () => { throw new Error("Unauthorized"); }, "Aprovado");
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagem.length).toBeGreaterThan(0);
  });
});