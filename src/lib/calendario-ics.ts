/** Gera um arquivo .ics (padrão de calendário) para a consulta e inicia o download. */
function formatarUtc(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapar(texto: string) {
  return texto.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function textoIcs(consulta: {
  id: string;
  inicio: string;
  fim: string;
  profissional: string;
  descricao?: string;
}) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TOC Brazil//Agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${consulta.id}@tocbrazil.com.br`,
    `DTSTAMP:${formatarUtc(new Date().toISOString())}`,
    `DTSTART:${formatarUtc(consulta.inicio)}`,
    `DTEND:${formatarUtc(consulta.fim)}`,
    `SUMMARY:${escapar(`Consulta com ${consulta.profissional}`)}`,
    `DESCRIPTION:${escapar(
      consulta.descricao ??
        "Consulta online. O endereço da sala de videochamada aparece na sua área na TOC Brazil pouco antes do horário.",
    )}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Sua consulta começa em 15 minutos",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function baixarIcs(consulta: {
  id: string;
  inicio: string;
  fim: string;
  profissional: string;
  descricao?: string;
}) {
  const blob = new Blob([textoIcs(consulta)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `consulta-toc-brazil-${consulta.inicio.slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
