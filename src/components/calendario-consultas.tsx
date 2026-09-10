import { useState } from "react";
import {
  DIAS_SEMANA_CURTOS,
  chaveDia,
  diaDaSemana,
  diasNoMes,
  hoje,
  horaDe,
  primeiroDiaDoMes,
  rotuloMes,
  somarMeses,
} from "@/lib/agenda-tempo";

export type ItemCalendario = {
  id: string;
  inicio: string;
  fim?: string;
  titulo: string;
  status: string;
  videoUrl?: string | null;
};

export function CalendarioConsultas({
  itens,
  selecionado,
  onSelecionar,
}: {
  itens: ItemCalendario[];
  selecionado?: string | null;
  onSelecionar?: (item: ItemCalendario) => void;
}) {
  const diaHoje = hoje();
  const [mes, setMes] = useState(primeiroDiaDoMes(diaHoje));

  const porDia = new Map<string, ItemCalendario[]>();
  for (const item of itens) {
    const k = chaveDia(item.inicio);
    porDia.set(k, [...(porDia.get(k) ?? []), item]);
  }
  for (const lista of porDia.values()) {
    lista.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  const offset = diaDaSemana(mes);
  const total = diasNoMes(mes);
  const celulas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => `${mes.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);

  const noMes = itens.filter((i) => chaveDia(i.inicio).slice(0, 7) === mes.slice(0, 7)).length;

  return (
    <div className="card-soft p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">{rotuloMes(mes)}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {noMes === 0
              ? "Nenhuma consulta neste mês"
              : `${noMes} consulta${noMes > 1 ? "s" : ""} neste mês`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Mês anterior"
            className="btn-base btn-ghost px-3 py-1.5 text-sm"
            onClick={() => setMes(somarMeses(mes, -1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="btn-base btn-ghost px-3 py-1.5 text-xs"
            onClick={() => setMes(primeiroDiaDoMes(diaHoje))}
          >
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            className="btn-base btn-ghost px-3 py-1.5 text-sm"
            onClick={() => setMes(somarMeses(mes, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {DIAS_SEMANA_CURTOS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celulas.map((dia, i) => {
          if (!dia) return <span key={`v${i}`} className="min-h-16" />;
          const doDia = porDia.get(dia) ?? [];
          const eHoje = dia === diaHoje;
          const passado = dia < diaHoje;
          return (
            <div
              key={dia}
              className={`min-h-16 rounded-xl border p-1.5 text-left text-xs sm:min-h-20 ${
                doDia.length > 0
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/50 bg-transparent"
              } ${eHoje ? "agenda-hoje" : ""} ${passado && doDia.length === 0 ? "opacity-60" : ""}`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  eHoje ? "bg-primary font-bold text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {Number(dia.slice(8))}
              </span>
              <div className="mt-1 space-y-0.5">
                {doDia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelecionar?.(item)}
                    className={`agenda-evento agenda-evento-paciente w-full ${
                      item.status === "aguardando_pagamento" ? "agenda-evento-aguardando" : ""
                    } ${selecionado === item.id ? "ring-2 ring-primary" : ""}`}
                    title={`${horaDe(item.inicio)} · ${item.titulo}`}
                  >
                    <span className="font-semibold">{horaDe(item.inicio)}</span>
                    <span className="hidden truncate sm:block">{item.titulo.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
