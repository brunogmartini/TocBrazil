import { useMemo, useState } from "react";
import type { ConsultaAgenda } from "@/lib/profissional.functions";
import {
  DIAS_SEMANA_CURTOS,
  chaveDia,
  dataLocal,
  diaDaSemana,
  diasNoMes,
  hoje,
  horaDe,
  horaMin,
  inicioDaSemana,
  minutosDoDia,
  primeiroDiaDoMes,
  rotuloDiaCurto,
  rotuloDiaLongo,
  rotuloMes,
  somarDias,
  somarMeses,
} from "@/lib/agenda-tempo";

export type Visao = "mes" | "semana" | "dia";

export type Regra = { id: string; weekday: number; hora_inicio: string; hora_fim: string };
export type Bloqueio = { id: string; inicio: string; fim: string; motivo: string | null };

type Props = {
  consultas: ConsultaAgenda[];
  regras: Regra[];
  bloqueios: Bloqueio[];
  slotMinutos: number;
  visao: Visao;
  dia: string;
  onMudarVisao: (v: Visao) => void;
  onMudarDia: (chave: string) => void;
  onSelecionarConsulta: (c: ConsultaAgenda) => void;
  onSelecionarBloqueio: (b: Bloqueio) => void;
  onNovoBloqueio: (inicio: Date, fim: Date) => void;
};

const ALTURA_HORA = 56; // px por hora nas visões semana/dia

function minutosDe(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

function classeEvento(status: string) {
  if (status === "aguardando_pagamento") return "agenda-evento agenda-evento-aguardando";
  if (status === "realizada") return "agenda-evento agenda-evento-realizada";
  return "agenda-evento";
}

export function AgendaProfissional(p: Props) {
  const diaHoje = hoje();
  const visiveis = useMemo(
    () => p.consultas.filter((c) => c.status !== "cancelada"),
    [p.consultas],
  );

  const consultasPorDia = useMemo(() => {
    const mapa = new Map<string, ConsultaAgenda[]>();
    for (const c of visiveis) {
      const k = chaveDia(c.inicio);
      mapa.set(k, [...(mapa.get(k) ?? []), c]);
    }
    for (const l of mapa.values()) l.sort((a, b) => a.inicio.localeCompare(b.inicio));
    return mapa;
  }, [visiveis]);

  function bloqueiosDoDia(chave: string) {
    const ini = dataLocal(chave, 0).getTime();
    const fim = dataLocal(chave, 0).getTime() + 86400_000;
    return p.bloqueios
      .map((b) => {
        const bi = new Date(b.inicio).getTime();
        const bf = new Date(b.fim).getTime();
        if (bf <= ini || bi >= fim) return null;
        return {
          ...b,
          minInicio: Math.max(0, bi <= ini ? 0 : minutosDoDia(b.inicio)),
          minFim: bf >= fim ? 1440 : minutosDoDia(b.fim),
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
  }

  function regrasDoDia(chave: string) {
    const wd = diaDaSemana(chave);
    return p.regras.filter((r) => r.weekday === wd);
  }

  // faixa de horas mostrada nas visões semana/dia
  const faixa = useMemo(() => {
    let min = 8 * 60;
    let max = 19 * 60;
    for (const r of p.regras) {
      min = Math.min(min, minutosDe(r.hora_inicio.slice(0, 5)));
      max = Math.max(max, minutosDe(r.hora_fim.slice(0, 5)));
    }
    for (const c of visiveis) {
      min = Math.min(min, minutosDoDia(c.inicio));
      max = Math.max(max, minutosDoDia(c.fim));
    }
    min = Math.floor(min / 60) * 60;
    max = Math.min(1440, Math.ceil(max / 60) * 60);
    return { min, max };
  }, [p.regras, visiveis]);

  function navegar(direcao: -1 | 1) {
    if (p.visao === "mes") p.onMudarDia(somarMeses(primeiroDiaDoMes(p.dia), direcao));
    else if (p.visao === "semana") p.onMudarDia(somarDias(p.dia, 7 * direcao));
    else p.onMudarDia(somarDias(p.dia, direcao));
  }

  const titulo =
    p.visao === "mes"
      ? rotuloMes(primeiroDiaDoMes(p.dia))
      : p.visao === "semana"
        ? `${rotuloDiaCurto(inicioDaSemana(p.dia))} – ${rotuloDiaCurto(somarDias(inicioDaSemana(p.dia), 6))}`
        : rotuloDiaLongo(p.dia);

  return (
    <div className="card-soft p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Anterior" className="btn-base btn-ghost px-3 py-1.5 text-sm" onClick={() => navegar(-1)}>
            ‹
          </button>
          <button type="button" className="btn-base btn-ghost px-3 py-1.5 text-xs" onClick={() => p.onMudarDia(diaHoje)}>
            Hoje
          </button>
          <button type="button" aria-label="Próximo" className="btn-base btn-ghost px-3 py-1.5 text-sm" onClick={() => navegar(1)}>
            ›
          </button>
          <h2 className="ml-2 text-lg">{titulo}</h2>
        </div>
        <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
          {(
            [
              ["mes", "Mês"],
              ["semana", "Semana"],
              ["dia", "Dia"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => p.onMudarVisao(id)}
              className={`rounded-full px-3 py-1.5 ${p.visao === id ? "bg-background font-semibold" : "text-muted-foreground"}`}
              aria-pressed={p.visao === id}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="agenda-livre inline-block h-3 w-3 rounded-sm" /> Livre</span>
        <span className="flex items-center gap-1.5"><i className="agenda-bloqueio inline-block h-3 w-3 rounded-sm" /> Bloqueado</span>
        <span className="flex items-center gap-1.5"><i className="agenda-evento inline-block h-3 w-3 p-0" /> Confirmada</span>
        <span className="flex items-center gap-1.5"><i className="agenda-evento agenda-evento-aguardando inline-block h-3 w-3 p-0" /> Aguardando pagamento</span>
        <span className="flex items-center gap-1.5"><i className="agenda-evento agenda-evento-realizada inline-block h-3 w-3 p-0" /> Realizada</span>
      </div>

      {p.visao === "mes" && (
        <VisaoMes
          mes={primeiroDiaDoMes(p.dia)}
          diaHoje={diaHoje}
          consultasPorDia={consultasPorDia}
          bloqueiosDoDia={bloqueiosDoDia}
          regrasDoDia={regrasDoDia}
          onAbrirDia={(d) => {
            p.onMudarDia(d);
            p.onMudarVisao("dia");
          }}
          onSelecionarConsulta={p.onSelecionarConsulta}
        />
      )}

      {p.visao !== "mes" && (
        <VisaoGrade
          dias={
            p.visao === "semana"
              ? Array.from({ length: 7 }, (_, i) => somarDias(inicioDaSemana(p.dia), i))
              : [p.dia]
          }
          diaHoje={diaHoje}
          faixa={faixa}
          slotMinutos={p.slotMinutos}
          consultasPorDia={consultasPorDia}
          bloqueiosDoDia={bloqueiosDoDia}
          regrasDoDia={regrasDoDia}
          onSelecionarConsulta={p.onSelecionarConsulta}
          onSelecionarBloqueio={p.onSelecionarBloqueio}
          onNovoBloqueio={p.onNovoBloqueio}
        />
      )}
    </div>
  );
}

function VisaoMes({
  mes,
  diaHoje,
  consultasPorDia,
  bloqueiosDoDia,
  regrasDoDia,
  onAbrirDia,
  onSelecionarConsulta,
}: {
  mes: string;
  diaHoje: string;
  consultasPorDia: Map<string, ConsultaAgenda[]>;
  bloqueiosDoDia: (c: string) => (Bloqueio & { minInicio: number; minFim: number })[];
  regrasDoDia: (c: string) => Regra[];
  onAbrirDia: (c: string) => void;
  onSelecionarConsulta: (c: ConsultaAgenda) => void;
}) {
  const offset = diaDaSemana(mes);
  const total = diasNoMes(mes);
  const celulas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => `${mes.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);

  return (
    <>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {DIAS_SEMANA_CURTOS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celulas.map((dia, i) => {
          if (!dia) return <span key={`v${i}`} />;
          const consultas = consultasPorDia.get(dia) ?? [];
          const bloqueios = bloqueiosDoDia(dia);
          const disponivel = regrasDoDia(dia).length > 0 && dia >= diaHoje;
          const diaInteiroBloqueado = bloqueios.some((b) => b.minInicio === 0 && b.minFim === 1440);
          const passado = dia < diaHoje;
          return (
            <div
              key={dia}
              className={`min-h-20 rounded-xl border border-border/50 p-1 text-xs sm:min-h-24 ${
                diaInteiroBloqueado ? "agenda-bloqueio" : disponivel ? "agenda-livre" : ""
              } ${dia === diaHoje ? "agenda-hoje" : ""} ${passado ? "agenda-passado" : ""}`}
            >
              <button
                type="button"
                onClick={() => onAbrirDia(dia)}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] hover:bg-accent ${
                  dia === diaHoje ? "bg-primary font-bold text-primary-foreground" : "text-muted-foreground"
                }`}
                aria-label={`Abrir ${rotuloDiaLongo(dia)}`}
              >
                {Number(dia.slice(8))}
              </button>
              <div className="mt-0.5 space-y-0.5">
                {consultas.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelecionarConsulta(c)}
                    className={`${classeEvento(c.status)} w-full`}
                    title={`${horaDe(c.inicio)} — ${c.paciente}`}
                  >
                    <span className="font-semibold">{horaDe(c.inicio)}</span>{" "}
                    <span className="hidden sm:inline">{c.paciente}</span>
                  </button>
                ))}
                {consultas.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onAbrirDia(dia)}
                    className="text-[10px] text-muted-foreground underline"
                  >
                    +{consultas.length - 3}
                  </button>
                )}
                {bloqueios.length > 0 && !diaInteiroBloqueado && (
                  <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
                    {bloqueios.map((b) => `${horaMin(b.minInicio)}–${horaMin(b.minFim)}`).join(", ")} bloq.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function VisaoGrade({
  dias,
  diaHoje,
  faixa,
  slotMinutos,
  consultasPorDia,
  bloqueiosDoDia,
  regrasDoDia,
  onSelecionarConsulta,
  onSelecionarBloqueio,
  onNovoBloqueio,
}: {
  dias: string[];
  diaHoje: string;
  faixa: { min: number; max: number };
  slotMinutos: number;
  consultasPorDia: Map<string, ConsultaAgenda[]>;
  bloqueiosDoDia: (c: string) => (Bloqueio & { minInicio: number; minFim: number })[];
  regrasDoDia: (c: string) => Regra[];
  onSelecionarConsulta: (c: ConsultaAgenda) => void;
  onSelecionarBloqueio: (b: Bloqueio) => void;
  onNovoBloqueio: (inicio: Date, fim: Date) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const horas = Array.from(
    { length: (faixa.max - faixa.min) / 60 },
    (_, i) => faixa.min + i * 60,
  );
  const altura = horas.length * ALTURA_HORA;
  const top = (min: number) => ((min - faixa.min) / 60) * ALTURA_HORA;
  const agoraMin = minutosDoDia(new Date());

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[36rem]" style={{ display: "grid", gridTemplateColumns: `3.25rem repeat(${dias.length}, minmax(0, 1fr))` }}>
        <span />
        {dias.map((d) => (
          <div key={d} className={`px-1 pb-2 text-center text-xs ${d === diaHoje ? "font-bold text-primary" : "text-muted-foreground"}`}>
            {dias.length === 1 ? rotuloDiaLongo(d) : rotuloDiaCurto(d)}
          </div>
        ))}

        <div className="relative" style={{ height: altura }}>
          {horas.map((h) => (
            <span
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
              style={{ top: top(h) }}
            >
              {horaMin(h)}
            </span>
          ))}
        </div>

        {dias.map((d) => {
          const consultas = consultasPorDia.get(d) ?? [];
          const bloqueios = bloqueiosDoDia(d);
          const regras = regrasDoDia(d);
          const passado = d < diaHoje;
          return (
            <div
              key={d}
              className={`relative border-l border-border/50 ${d === diaHoje ? "bg-primary/[0.03]" : ""} ${passado ? "agenda-passado" : ""}`}
              style={{ height: altura }}
            >
              {horas.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={`Bloquear ${rotuloDiaCurto(d)} às ${horaMin(h)}`}
                  onMouseEnter={() => setHover(`${d}-${h}`)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() =>
                    onNovoBloqueio(
                      dataLocal(d, h / 60),
                      new Date(dataLocal(d, h / 60).getTime() + Math.max(slotMinutos, 30) * 60000),
                    )
                  }
                  className={`absolute inset-x-0 border-t border-border/40 ${hover === `${d}-${h}` ? "bg-accent/40" : ""}`}
                  style={{ top: top(h), height: ALTURA_HORA }}
                />
              ))}

              {regras.map((r) => {
                const a = Math.max(faixa.min, minutosDe(r.hora_inicio.slice(0, 5)));
                const b = Math.min(faixa.max, minutosDe(r.hora_fim.slice(0, 5)));
                if (b <= a) return null;
                return (
                  <div
                    key={r.id}
                    className="agenda-livre pointer-events-none absolute inset-x-0"
                    style={{ top: top(a), height: top(b) - top(a) }}
                  />
                );
              })}

              {bloqueios.map((b) => {
                const a = Math.max(faixa.min, b.minInicio);
                const f = Math.min(faixa.max, b.minFim);
                if (f <= a) return null;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelecionarBloqueio(b)}
                    className="agenda-bloqueio absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px]"
                    style={{ top: top(a) + 1, height: Math.max(18, top(f) - top(a) - 2) }}
                    title={b.motivo ?? "Bloqueado"}
                  >
                    {b.motivo ?? "Bloqueado"}
                  </button>
                );
              })}

              {consultas.map((c) => {
                const a = minutosDoDia(c.inicio);
                const f = Math.min(faixa.max, minutosDoDia(c.fim));
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelecionarConsulta(c)}
                    className={`${classeEvento(c.status)} absolute inset-x-1 shadow-soft`}
                    style={{ top: top(a) + 1, height: Math.max(22, top(f) - top(a) - 2) }}
                    title={`${horaDe(c.inicio)} — ${c.paciente}`}
                  >
                    <span className="font-semibold">{horaDe(c.inicio)}</span> {c.paciente}
                    {c.codigo && dias.length === 1 && (
                      <span className="ml-1 text-muted-foreground">· {c.codigo}</span>
                    )}
                  </button>
                );
              })}

              {d === diaHoje && agoraMin >= faixa.min && agoraMin <= faixa.max && (
                <div
                  className="pointer-events-none absolute inset-x-0 border-t-2 border-destructive/70"
                  style={{ top: top(agoraMin) }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
