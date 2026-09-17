/**
 * Utilitários de exibição de consultas.
 * A TOC Brazil não cria nem hospeda sala de videochamada: a consulta acontece
 * na ferramenta cadastrada e mantida pelo próprio psicólogo.
 */

export const rotuloStatusConsulta: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
  nao_compareceu: "Não compareceu",
  expirado: "Expirado",
};

export function moeda(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const TZ = "America/Sao_Paulo";

export function dataHoraBR(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ,
    ...opts,
  });
}

export function horaBR(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function dataBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ });
}
