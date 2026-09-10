/**
 * Camada de videochamada.
 * Cada consulta recebe um link exclusivo, guardado em `appointments.video_url`
 * junto com o provedor usado (`video_provider`). Para trocar de serviço
 * (Daily, Whereby, Zoom, Google Meet...), basta adicionar um ramo aqui e
 * definir a configuração `video_provider` nas configurações da plataforma.
 */
export type ProvedorVideo = "jitsi" | "externo";

export function gerarSalaVideo(provedor: string | undefined, consultaId: string) {
  const codigo = consultaId.replace(/-/g, "").slice(0, 16);
  switch (provedor) {
    case "jitsi":
    default:
      return {
        provider: "jitsi" as ProvedorVideo,
        url: `https://meet.jit.si/tocbrazil-${codigo}`,
      };
  }
}

export const rotuloStatusConsulta: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
  nao_compareceu: "Não compareceu",
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
