import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { adicionarAnotacao, fichaPaciente, salvarFichaPaciente } from "@/lib/profissional.functions";
import { ProfessionalNav } from "@/components/professional-nav";
import { dataBR, dataHoraBR, rotuloStatusConsulta } from "@/lib/video-sala";

export const Route = createFileRoute("/_authenticated/profissional/ficha/$patientId")({
  head: () => ({
    meta: [
      { title: "Ficha do paciente — TOC Brazil" },
      { name: "description", content: "Ficha clínica sigilosa, visível apenas ao profissional vinculado." },
      { property: "og:title", content: "Ficha sigilosa — TOC Brazil" },
      { property: "og:description", content: "Registro clínico protegido do paciente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Ficha,
});

const CAMPOS = [
  { chave: "informacoes_relevantes", rotulo: "Informações relevantes", dica: "Contexto, rede de apoio, medicações em uso, contatos de emergência." },
  { chave: "diagnostico", rotulo: "Diagnóstico / hipótese diagnóstica", dica: "Subtipos de TOC, comorbidades, instrumentos aplicados (Y-BOCS etc.)." },
  { chave: "historico", rotulo: "Histórico", dica: "Início dos sintomas, tratamentos anteriores, internações." },
  { chave: "observacoes", rotulo: "Observações", dica: "Pontos de atenção para o acompanhamento." },
  { chave: "evolucao", rotulo: "Evolução", dica: "Resumo do progresso ao longo das sessões." },
] as const;

type ChaveCampo = (typeof CAMPOS)[number]["chave"];

function Ficha() {
  const { patientId } = Route.useParams();
  const queryClient = useQueryClient();
  const carregar = useServerFn(fichaPaciente);
  const salvar = useServerFn(salvarFichaPaciente);
  const anotar = useServerFn(adicionarAnotacao);

  const dados = useQuery({
    queryKey: ["ficha", patientId],
    queryFn: () => carregar({ data: { patientId } }),
  });

  const [campos, setCampos] = useState<Record<ChaveCampo, string>>({
    informacoes_relevantes: "",
    diagnostico: "",
    historico: "",
    observacoes: "",
    evolucao: "",
  });
  const [consultaAnotacao, setConsultaAnotacao] = useState("");
  const [textoAnotacao, setTextoAnotacao] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (dados.data?.ok) {
      const f = dados.data.ficha;
      setCampos({
        informacoes_relevantes: f?.informacoes_relevantes ?? "",
        diagnostico: f?.diagnostico ?? "",
        historico: f?.historico ?? "",
        observacoes: f?.observacoes ?? "",
        evolucao: f?.evolucao ?? "",
      });
      if (!consultaAnotacao) {
        const elegivel = dados.data.consultas.find((c) => c.status === "confirmada" || c.status === "realizada");
        if (elegivel) setConsultaAnotacao(elegivel.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.data]);

  if (dados.isLoading) {
    return <div className="professional-workspace container-page py-16 text-muted-foreground">Carregando…</div>;
  }

  if (!dados.data?.ok) {
    return (
      <div className="professional-workspace container-page py-16">
        <h1 className="text-3xl">Ficha indisponível</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">{dados.data?.erro ?? "Não foi possível abrir a ficha."}</p>
        <Link to="/profissional/agenda" className="btn-base btn-primary mt-8">
          Voltar para a agenda
        </Link>
      </div>
    );
  }

  const { paciente, consultas, anotacoes } = dados.data;
  const idade = paciente.data_nascimento
    ? Math.floor((Date.now() - new Date(paciente.data_nascimento).getTime()) / (365.25 * 86400_000))
    : null;
  const elegiveis = consultas.filter((c) => c.status === "confirmada" || c.status === "realizada");

  return (
    <div className="professional-workspace py-12 lg:py-16">
      <div className="container-page">
        <div className="professional-heading flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div>
            <span className="professional-label">Ficha sigilosa</span>
            <h1 className="mt-3 text-3xl sm:text-4xl">{paciente.nome ?? "Paciente"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {paciente.codigo_anonimo && <>Código {paciente.codigo_anonimo} · </>}
              {idade !== null && <>{idade} anos · </>}
              {paciente.email}
              {paciente.telefone && <> · {paciente.telefone}</>}
            </p>
          </div>
          <Link to="/profissional/agenda" className="btn-base btn-ghost">
            Voltar para a agenda
          </Link>
        </div>

        <ProfessionalNav ativo="/profissional/agenda" />

        <p className="mt-6 rounded-xl border border-border/60 p-4 text-xs leading-relaxed text-muted-foreground">
          Estas informações são protegidas: só você, como profissional vinculado a este paciente, pode
          vê-las. Elas não aparecem para outros profissionais, para a gestão da plataforma nem em áreas públicas.
        </p>

        {aviso && <p className="card-soft mt-6 border-primary/40 p-4 text-sm" role="status">{aviso}</p>}
        {erro && <p className="mt-6 text-sm text-destructive" role="alert">{erro}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            className="card-soft space-y-5 p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setSalvando(true);
              setErro(null);
              setAviso(null);
              const r = await salvar({ data: { patientId, ...campos } });
              setSalvando(false);
              if (!r.ok) setErro(r.erro);
              else {
                setAviso("Ficha salva.");
                await queryClient.invalidateQueries({ queryKey: ["ficha", patientId] });
              }
            }}
          >
            <h2 className="text-xl">Registro clínico</h2>
            {CAMPOS.map((c) => (
              <label key={c.chave} className="block text-sm">
                {c.rotulo}
                <textarea
                  className="field-base mt-1"
                  rows={c.chave === "evolucao" || c.chave === "historico" ? 5 : 3}
                  maxLength={8000}
                  placeholder={c.dica}
                  value={campos[c.chave]}
                  onChange={(e) => setCampos({ ...campos, [c.chave]: e.target.value })}
                />
              </label>
            ))}
            <button type="submit" disabled={salvando} className="btn-base btn-primary disabled:opacity-60">
              {salvando ? "Salvando…" : "Salvar ficha"}
            </button>
          </form>

          <div className="space-y-8">
            <section className="card-soft p-6">
              <h2 className="text-xl">Nova anotação</h2>
              {elegiveis.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  As anotações ficam vinculadas a uma consulta confirmada ou realizada.
                </p>
              ) : (
                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setErro(null);
                    const r = await anotar({ data: { appointmentId: consultaAnotacao, conteudo: textoAnotacao } });
                    if (!r.ok) setErro(r.erro);
                    else {
                      setTextoAnotacao("");
                      await queryClient.invalidateQueries({ queryKey: ["ficha", patientId] });
                    }
                  }}
                >
                  <label className="block text-sm">
                    Consulta
                    <select
                      className="field-base mt-1"
                      value={consultaAnotacao}
                      onChange={(e) => setConsultaAnotacao(e.target.value)}
                    >
                      {elegiveis.map((c) => (
                        <option key={c.id} value={c.id}>
                          {dataHoraBR(c.inicio)} — {rotuloStatusConsulta[c.status] ?? c.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    className="field-base"
                    rows={4}
                    maxLength={8000}
                    value={textoAnotacao}
                    onChange={(e) => setTextoAnotacao(e.target.value)}
                    placeholder="O que foi trabalhado, tarefas de EPR, respostas do paciente…"
                  />
                  <button type="submit" disabled={!textoAnotacao.trim()} className="btn-base btn-primary disabled:opacity-60">
                    Adicionar anotação
                  </button>
                </form>
              )}
            </section>

            <section>
              <h2 className="text-xl">Histórico de anotações</h2>
              {anotacoes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nenhuma anotação registrada.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {anotacoes.map((a) => {
                    const c = consultas.find((x) => x.id === a.appointment_id);
                    return (
                      <li key={a.id} className="card-soft p-4 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {c ? `Consulta de ${dataHoraBR(c.inicio)}` : "Consulta"} · registrado em {dataHoraBR(a.created_at)}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap">{a.conteudo}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-xl">Consultas com você</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {consultas.map((c) => (
                  <li key={c.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-muted px-4 py-3">
                    <span>{dataHoraBR(c.inicio)} · {c.duracao_minutos} min</span>
                    <span className="text-muted-foreground">{rotuloStatusConsulta[c.status] ?? c.status}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Paciente na plataforma desde {dataBR(paciente.created_at)}.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
