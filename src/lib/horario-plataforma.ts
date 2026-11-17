// Janela em que a plataforma aceita consultas (horário de Brasília). O psicólogo escolhe e bloqueia horários dentro dela.
export const JANELA_PLATAFORMA: Record<number, { inicio: string; fim: string } | null> = {
  0: null,
  1: { inicio: "08:00", fim: "18:00" }, 2: { inicio: "08:00", fim: "18:00" }, 3: { inicio: "08:00", fim: "18:00" },
  4: { inicio: "08:00", fim: "18:00" }, 5: { inicio: "08:00", fim: "18:00" },
  6: { inicio: "08:00", fim: "11:00" },
};
/** Ajusta uma faixa à janela da plataforma; null quando não sobra horário (ex.: domingo). */
export function limitarFaixa(weekday: number, inicio: string, fim: string) {
  const j = JANELA_PLATAFORMA[weekday];
  if (!j) return null;
  const i = inicio < j.inicio ? j.inicio : inicio, f = fim > j.fim ? j.fim : fim;
  return i < f ? { inicio: i, fim: f } : null;
}
