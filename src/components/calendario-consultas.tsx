import { useState } from "react";

export type ItemCalendario = {
  id: string;
  inicio: string;
  titulo: string;
  status: string;
};

const DIAS_CURTOS = ["D", "S", "T", "Q", "Q", "S", "S"];

function chave(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarioConsultas({ itens }: { itens: ItemCalendario[] }) {
  const hoje = new Date();
  const [mes, setMes] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const porDia = new Map<string, ItemCalendario[]>();
  for (const item of itens) {
    const k = chave(new Date(item.inicio));
    porDia.set(k, [...(porDia.get(k) ?? []), item]);
  }

  const primeiroDiaSemana = mes.getDay();
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celulas: (Date | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from(
      { length: diasNoMes },
      (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1),
    ),
  ];

  return (
    <div className="card-soft p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg capitalize">
          {mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Mês anterior"
            className="btn-base btn-ghost px-3 py-1.5 text-sm"
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            className="btn-base btn-ghost px-3 py-1.5 text-sm"
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS_CURTOS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celulas.map((dia, i) => {
          if (!dia) return <span key={`v${i}`} />;
          const doDia = porDia.get(chave(dia)) ?? [];
          const eHoje = chave(dia) === chave(hoje);
          return (
            <div
              key={chave(dia)}
              className={`min-h-14 rounded-xl border p-1.5 text-left text-xs ${
                doDia.length > 0
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/60 bg-transparent"
              }`}
            >
              <span className={eHoje ? "font-bold text-primary" : "text-muted-foreground"}>
                {dia.getDate()}
              </span>
              {doDia.map((item) => (
                <p key={item.id} className="mt-0.5 truncate font-semibold text-foreground">
                  {new Date(item.inicio).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
