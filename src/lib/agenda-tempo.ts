/**
 * Utilidades de calendário no fuso de Brasília (America/Sao_Paulo, UTC-3 fixo).
 * Todas as datas do banco são UTC; aqui convertemos para "chaves de dia"
 * (YYYY-MM-DD) e minutos do dia no fuso local da plataforma.
 */
export const TZ = "America/Sao_Paulo";
const OFFSET = "-03:00";

export function chaveDia(d: Date | string) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
}

export function minutosDoDia(d: Date | string) {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(d));
  const h = Number(partes.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(partes.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function dataLocal(chave: string, hora = 0, minuto = 0) {
  const hh = String(hora).padStart(2, "0");
  const mm = String(minuto).padStart(2, "0");
  return new Date(`${chave}T${hh}:${mm}:00${OFFSET}`);
}

export function somarDias(chave: string, n: number) {
  return chaveDia(new Date(dataLocal(chave, 12).getTime() + n * 86400_000));
}

export function diaDaSemana(chave: string) {
  return dataLocal(chave, 12).getUTCDay();
}

export function hoje() {
  return chaveDia(new Date());
}

export function inicioDaSemana(chave: string) {
  return somarDias(chave, -diaDaSemana(chave));
}

export function primeiroDiaDoMes(chave: string) {
  return `${chave.slice(0, 7)}-01`;
}

export function somarMeses(chave: string, n: number) {
  const [ano, mes] = chave.split("-").map(Number) as [number, number, number];
  const total = ano * 12 + (mes - 1) + n;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}-01`;
}

export function diasNoMes(chave: string) {
  const [ano, mes] = chave.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function rotuloMes(chave: string) {
  const texto = dataLocal(chave, 12).toLocaleDateString("pt-BR", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloDiaLongo(chave: string) {
  const texto = dataLocal(chave, 12).toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloDiaCurto(chave: string) {
  return dataLocal(chave, 12).toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
  });
}

export function horaMin(minutos: number) {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

export function horaDe(d: Date | string) {
  return new Date(d).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function paraInputLocal(d: Date | string) {
  const c = chaveDia(d);
  return `${c}T${horaMin(minutosDoDia(d))}`;
}

export function deInputLocal(valor: string) {
  // valor "YYYY-MM-DDTHH:MM" interpretado no fuso de Brasília
  return new Date(`${valor}:00${OFFSET}`);
}

export const DIAS_SEMANA_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
