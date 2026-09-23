import { describe, expect, it } from "vitest";
import { detectarAnticontato } from "./anticontato";

const bloqueados = [
  ["(51) 99876-5432", "telefone"],
  ["51.99876.5432", "telefone"],
  ["99876543", "telefone"],
  ["+55 51 99876 5432", "telefone"],
  ["nove nove oito sete seis cinco quatro três", "numero_por_extenso"],
  ["cinquenta e um", "numero_por_extenso"],
  ["nome@exemplo.com.br", "email"],
  ["https://exemplo.com/perfil", "url"],
  ["exemplo.com.br", "url"],
  ["bit.ly/agenda", "url"],
  ["fale com @meuperfil", "arroba"],
] as const;

const advertidos = ["me chama", "WhatsApp", "por fora", "meu pix", "instagram", "direct"];
const legitimos = [
  "Preciso remarcar para terça-feira.",
  "Tive contato com esse tema na graduação.",
  "A consulta pode ser às nove horas?",
  "Quero conversar sobre o pagamento da consulta.",
  "Atendo adultos com TOC e trabalho de forma colaborativa.",
];

describe("detectarAnticontato", () => {
  it.each(bloqueados)("bloqueia %s como %s", (texto, tipo) => {
    expect(detectarAnticontato(texto)).toEqual(expect.arrayContaining([expect.objectContaining({ tipo, bloqueiaChat: true })]));
  });
  it.each(advertidos)("adverte sem bloquear o chat: %s", (texto) => {
    expect(detectarAnticontato(texto)).toEqual(expect.arrayContaining([expect.objectContaining({ tipo: "termo_contato", bloqueiaChat: false })]));
  });
  it.each(legitimos)("não sinaliza frase legítima: %s", (texto) => {
    expect(detectarAnticontato(texto)).toEqual([]);
  });
});