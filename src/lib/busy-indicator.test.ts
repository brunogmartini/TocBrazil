import { describe, expect, it } from "vitest";
import { JANELA_CLIQUE_MS, requisicaoPertenceAoClique } from "./busy-indicator";

describe("indicador de carregamento", () => {
  it("atribui ao botão a requisição iniciada logo após o clique", () => {
    expect(requisicaoPertenceAoClique(1000, 1010)).toBe(true);
    expect(requisicaoPertenceAoClique(1000, 1000 + JANELA_CLIQUE_MS)).toBe(true);
  });
  it("ignora requisições sem clique, anteriores ao clique ou muito depois dele", () => {
    expect(requisicaoPertenceAoClique(null, 1000)).toBe(false);
    expect(requisicaoPertenceAoClique(1000, 990)).toBe(false);
    expect(requisicaoPertenceAoClique(1000, 1001 + JANELA_CLIQUE_MS)).toBe(false);
  });
});
