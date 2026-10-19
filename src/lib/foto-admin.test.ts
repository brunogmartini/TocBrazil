import { describe, expect, it } from "vitest";
import { exigirAdminFoto, validarFotoAdmin, LIMITE_FOTO_BYTES } from "./foto-admin";

function png(width: number, height: number) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width); view.setUint32(20, height);
  return bytes;
}

describe("foto adicionada pela gestão", () => {
  it("permite somente papel administrativo confirmado", () => {
    expect(() => exigirAdminFoto(true)).not.toThrow();
    expect(() => exigirAdminFoto(false)).toThrow();
    expect(() => exigirAdminFoto(null)).toThrow();
  });
  it("aceita foto quadrada de 600 pixels", () => expect(validarFotoAdmin(png(600, 600), "image/png")).toBe("png"));
  it("recusa foto menor que 600 pixels", () => expect(() => validarFotoAdmin(png(599, 599), "image/png")).toThrow());
  it("recusa foto não quadrada", () => expect(() => validarFotoAdmin(png(600, 800), "image/png")).toThrow());
  it("recusa arquivo acima de 5 MB", () => expect(() => validarFotoAdmin(new Uint8Array(LIMITE_FOTO_BYTES + 1), "image/png")).toThrow());
  it("recusa formato declarado divergente", () => expect(() => validarFotoAdmin(png(600, 600), "image/jpeg")).toThrow());
  it("recusa SVG e arquivo inválido", () => {
    expect(() => validarFotoAdmin(png(600, 600), "image/svg+xml")).toThrow();
    expect(() => validarFotoAdmin(new Uint8Array([1, 2]), "image/png")).toThrow();
  });
});