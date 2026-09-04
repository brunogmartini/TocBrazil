import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  criarBloqueio,
  meuCadastroProfissional,
  removerBloqueio,
  salvarDisponibilidade,
} from "@/lib/profissional.functions";

export const Route = createFileRoute("/_authenticated/profissional/agenda")({
  head: () => ({
    meta: [
      { title: "Minha agenda — TOC Brazil" },
      {
        name: "description",
        content: "Defina os dias e horários em que você atende e bloqueie períodos.",
      },
      { property: "og:title", content: "Minha agenda — TOC Brazil" },
      {
        property: "og:description",
        content: "Dias, horários e bloqueios da sua agenda na TOC Brazil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgendaProfissional,
});

const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

type Faixa = { ativo: boolean; inicio: string; fim: string };

function AgendaProfissional() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(meuCadastroProfissional);
  const salvar = useServerFn(salvarDisponibilidade);
  const bloquear = useServerFn(criarBloqueio);
  const desbloquear = useServerFn(removerBloqueio);

  const dados = useQuery({ queryKey: ["cadastro-profissional"], queryFn: () => carregar() });

  const [faixas, setFaixas] = useState<Faixa[]>(
    DIAS.map((_, i) => ({
      ativo: i >= 1 && i <= 5,
      inicio: "09:00",
      fim: "17:00",
    })),
  );
  const [bloqueio, setBloqueio] = useState({ inicio: "", fim: "", motivo: "" });
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const regras = dados.data?.regras;
    if (regras && regras.length) {
      setFaixas(
        DIAS.map((_, i) => {
          const r = regras.find((x) => x.weekday === i);
          return r
            ? { ativo: true, inicio: r.hora_inicio.slice(0, 5), fim: r.hora_fim.slice(0, 5) }
            : { ativo: false, inicio: "09:00", fim: "17:00" };
        }),
      );
    }
  }, [dados.data]);

  const semCadastro = !dados.data?.profissional && !dados.isLoading;

  async function enviarAgenda(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    const regras = faixas
      .map((f, i) => ({ weekday: i, hora_inicio: f.inicio, hora_fim: f.fim, ativo: f.ativo }))
      .filter((f) => f.ativo)
      .map(({ weekday, hora_inicio, hora_fim }) => ({ weekday, hora_inicio, hora_fim }));
    const r = await salvar({ data: { regras } });
    if (!r.ok) setErro(r.erro);
    else {
      setAviso("Agenda atualizada. Os horários livres já aparecem para os pacientes.");
      await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
    }
  }

  async function enviarBloqueio(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    const r = await bloquear({ data: bloqueio });
    if (!r.ok) setErro(r.erro);
    else {
      setAviso("Período bloqueado.");
      setBloqueio({ inicio: "", fim: "", motivo: "" });
      await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
    }
  }

  if (semCadastro) {
    return (
      <div className="container-page py-16">
        <h1 className="text-3xl">Complete seu cadastro primeiro</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Assim que seus dados profissionais estiverem salvos, você poderá definir sua agenda.
        </p>
        <Link to="/profissional/cadastro" className="btn-base btn-primary mt-8">
          Ir para o meu cadastro
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Área do profissional</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Minha agenda</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Marque os dias em que você atende e o intervalo de horários. Os horários são divididos
        automaticamente pela duração da sua consulta, no fuso de Brasília, e só aparecem para os
        pacientes se estiverem livres.
      </p>

      {aviso && <p className="mt-6 text-sm font-semibold">{aviso}</p>}
      {erro && <p className="mt-6 text-sm font-semibold text-destructive">{erro}</p>}

      <form onSubmit={enviarAgenda} className="card-soft mt-8 p-7">
        <ul className="space-y-4">
          {DIAS.map((dia, i) => (
            <li key={dia} className="flex flex-wrap items-center gap-4 border-t border-border pt-4 first:border-0 first:pt-0">
              <label className="flex min-w-[11rem] items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={faixas[i]!.ativo}
                  onChange={(e) =>
                    setFaixas(faixas.map((f, j) => (j === i ? { ...f, ativo: e.target.checked } : f)))
                  }
                />
                {dia}
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                das
                <input
                  type="time"
                  className="field-base w-32"
                  value={faixas[i]!.inicio}
                  disabled={!faixas[i]!.ativo}
                  onChange={(e) =>
                    setFaixas(faixas.map((f, j) => (j === i ? { ...f, inicio: e.target.value } : f)))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                às
                <input
                  type="time"
                  className="field-base w-32"
                  value={faixas[i]!.fim}
                  disabled={!faixas[i]!.ativo}
                  onChange={(e) =>
                    setFaixas(faixas.map((f, j) => (j === i ? { ...f, fim: e.target.value } : f)))
                  }
                />
              </label>
            </li>
          ))}
        </ul>
        <button type="submit" className="btn-base btn-primary mt-7">
          Salvar agenda
        </button>
      </form>

      <section className="mt-12">
        <h2 className="text-2xl">Bloquear um período</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Use para férias, compromissos ou qualquer intervalo em que você não quer receber
          agendamentos.
        </p>
        <form onSubmit={enviarBloqueio} className="card-soft mt-5 grid gap-5 p-7 sm:grid-cols-3">
          <div>
            <label htmlFor="bloqueio-inicio" className="section-label">
              Início
            </label>
            <input
              id="bloqueio-inicio"
              type="datetime-local"
              required
              className="field-base mt-2"
              value={bloqueio.inicio}
              onChange={(e) => setBloqueio({ ...bloqueio, inicio: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bloqueio-fim" className="section-label">
              Fim
            </label>
            <input
              id="bloqueio-fim"
              type="datetime-local"
              required
              className="field-base mt-2"
              value={bloqueio.fim}
              onChange={(e) => setBloqueio({ ...bloqueio, fim: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bloqueio-motivo" className="section-label">
              Motivo (opcional)
            </label>
            <input
              id="bloqueio-motivo"
              className="field-base mt-2"
              value={bloqueio.motivo}
              onChange={(e) => setBloqueio({ ...bloqueio, motivo: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-base btn-primary sm:col-span-3">
            Bloquear período
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {(dados.data?.bloqueios ?? []).length === 0 ? (
            <li className="text-sm text-muted-foreground">Nenhum bloqueio ativo.</li>
          ) : (
            (dados.data?.bloqueios ?? []).map((b) => (
              <li
                key={b.id}
                className="card-soft flex flex-wrap items-center justify-between gap-3 p-5 text-sm"
              >
                <span>
                  {new Date(b.inicio).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  até{" "}
                  {new Date(b.fim).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  })}
                  {b.motivo ? ` · ${b.motivo}` : ""}
                </span>
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={async () => {
                    await desbloquear({ data: { id: b.id } });
                    await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
                  }}
                >
                  Remover
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="mt-12">
        <Link to="/profissional" className="btn-base btn-ghost">
          Voltar para a área do profissional
        </Link>
      </div>
    </div>
  );
}
