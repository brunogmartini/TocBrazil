import { createFileRoute, Link } from "@tanstack/react-router";
import { exigirAreaGestor } from "@/lib/role-access";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  definirStatusConsultaAdmin,
  definirStatusDocumento,
  definirStatusFoto,
  definirStatusPagamento,
  definirStatusProfissional,
  excluirProfissional,
  conferirCadastroProfissional,
  editarProfissionalAdmin,
  obterDocumentoCredenciamento,
  painelAdmin,
  relatorioMetadados,
  salvarConfiguracoes,
  type ProfissionalAdmin,
} from "@/lib/admin.functions";
import type { ConfiguracoesPlataforma } from "@/lib/plataforma.functions";
import { EtapasCadastro } from "@/components/professional-nav";
import { indicadoresGestao } from "@/lib/continuidade.functions";
import { dataBR, dataHoraBR, moeda, rotuloStatusConsulta } from "@/lib/video-sala";
import { AsaasAdminLab } from "@/components/asaas-admin-lab";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ABORDAGENS_PERFIL, IDIOMAS_PERFIL, TEMAS_TOC_PERFIL } from "@/lib/perfil-profissional";

export const Route = createFileRoute("/_authenticated/admin")({
  // Área exclusiva do gestor: qualquer outra conta é levada de volta à sua própria área.
  beforeLoad: () => exigirAreaGestor(),
  head: () => ({
    meta: [
      { title: "Painel do gestor — TOC Brazil" },
      {
        name: "description",
        content:
          "Visão geral da plataforma: pacientes, psicólogos, consultas, taxa fixa, pagamentos e configurações.",
      },
      { property: "og:title", content: "Painel do gestor — TOC Brazil" },
      { property: "og:description", content: "Gestão completa da TOC Brazil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const rotuloPagamento: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  estornado: "Estornado",
  cancelado: "Cancelado",
};

const rotuloStatusProf: Record<string, string> = {
  pendente: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  suspenso: "Suspenso",
  descredenciado: "Excluído",
};

const rotuloDoc: Record<string, string> = {
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

type Aba = "visao" | "pacientes" | "profissionais" | "consultas" | "financeiro" | "asaas" | "relatorio" | "configuracoes";
type FiltroProf = "todos" | "pendente" | "aprovado" | "rejeitado" | "suspenso" | "descredenciado";
type FiltroPagamento = "pendente" | "aprovado" | "todos";

function Admin() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(painelAdmin);
  const carregarRelatorio = useServerFn(relatorioMetadados);
  const mudarStatusProf = useServerFn(definirStatusProfissional);
  const excluirProf = useServerFn(excluirProfissional);
  const conferirCadastro = useServerFn(conferirCadastroProfissional);
  const mudarStatusDoc = useServerFn(definirStatusDocumento);
  const mudarStatusFoto = useServerFn(definirStatusFoto);
  const editarProf = useServerFn(editarProfissionalAdmin);
  const abrirDocumento = useServerFn(obterDocumentoCredenciamento);
  const mudarPagamento = useServerFn(definirStatusPagamento);
  const mudarConsulta = useServerFn(definirStatusConsultaAdmin);
  const salvarCfg = useServerFn(salvarConfiguracoes);
  const carregarIndicadores = useServerFn(indicadoresGestao);

  const [aba, setAba] = useState<Aba>("visao");
  const [busca, setBusca] = useState("");
  const [filtroProf, setFiltroProf] = useState<FiltroProf>("pendente");
  const [filtroPagamento, setFiltroPagamento] = useState<FiltroPagamento>("pendente");
  const [aberto, setAberto] = useState<string | null>(null);
  const [observacao, setObservacao] = useState<Record<string, string>>({});
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [protecaoDocumentos, setProtecaoDocumentos] = useState<{ factorId: string; qr?: string; secret?: string } | null>(null);
  const [codigoDocumentos, setCodigoDocumentos] = useState("");
  const [documentosDesbloqueados, setDocumentosDesbloqueados] = useState(false);
  const painel = useQuery({
    queryKey: ["painel-admin"],
    queryFn: () => carregar(),
    refetchInterval: aba === "financeiro" ? 15_000 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const relatorio = useQuery({
    queryKey: ["admin-relatorio"],
    queryFn: () => carregarRelatorio({ data: {} }),
    enabled: aba === "relatorio",
  });
  const indicadores = useQuery({ queryKey: ["admin-indicadores"], queryFn: () => carregarIndicadores(), enabled: aba === "relatorio" });
  const atualizar = () => queryClient.invalidateQueries({ queryKey: ["painel-admin"] });

  if (painel.isPending) {
    return (
      <div className="container-page py-20">
        <p className="text-muted-foreground">Confirmando acesso à gestão…</p>
      </div>
    );
  }

  if (painel.isError) {
    return (
      <div className="container-page py-20">
        <h1 className="text-3xl">Acesso restrito</h1>
        <p className="mt-3 text-muted-foreground">Esta área é exclusiva da gestão da plataforma.</p>
        <Link to="/painel" className="btn-base btn-primary mt-6">
          Voltar para minha área
        </Link>
      </div>
    );
  }

  const dados = painel.data;
  const filtro = busca.trim().toLowerCase();
  const t = dados?.totais;

  const pacientes = (dados?.pacientes ?? []).filter(
    (u) =>
      !(u.papeis.includes("profissional") || u.papeis.includes("admin")) &&
      (!filtro || (u.nome ?? "").toLowerCase().includes(filtro) || (u.email ?? "").toLowerCase().includes(filtro)),
  );
  const consultas = (dados?.consultas ?? []).filter(
    (c) => !filtro || c.paciente.toLowerCase().includes(filtro) || c.profissional.toLowerCase().includes(filtro),
  );
  const profissionais = (dados?.profissionais ?? []).filter(
    (p) =>
      (!filtro || p.nome.toLowerCase().includes(filtro) || p.registro.toLowerCase().includes(filtro)) &&
       (filtroProf === "todos" ? p.status !== "descredenciado" : p.status === filtroProf),
  );
  const pagamentos = (dados?.pagamentos ?? []).filter((r) => !filtro || r.profissional.toLowerCase().includes(filtro));
  const pagamentosVisiveis = pagamentos.filter((r) => {
    if (filtroPagamento === "pendente") return r.status !== "aprovado";
    if (filtroPagamento === "aprovado") return r.status === "aprovado";
    return true;
  });

  async function aplicarStatus(
    p: ProfissionalAdmin,
    status: "pendente" | "aprovado" | "rejeitado" | "suspenso",
    requerCorrecao = false,
  ) {
    const r = await mudarStatusProf({
      data: { id: p.id, status, observacao: observacao[p.id] ?? p.observacao_admin ?? "", requerCorrecao },
    });
    setAviso(r.ok ? "Status atualizado." : r.erro);
    await atualizar();
  }

  async function confirmarExclusao(p: ProfissionalAdmin) {
    if (!window.confirm(`Excluir ${p.nome} da plataforma? O perfil deixará de aparecer para pacientes. Consultas, pagamentos, contratos e histórico serão preservados.`)) return;
    setExcluindo(p.id);
    setAviso(null);
    try {
      const resultado = await excluirProf({ data: { id: p.id } });
      setAviso(resultado.ok ? `${p.nome} foi retirado da lista de profissionais. O histórico foi preservado.` : resultado.erro);
      if (resultado.ok) setAberto(null);
      await atualizar();
    } catch {
      setAviso("Não foi possível excluir o profissional da lista. Tente novamente.");
    } finally {
      setExcluindo(null);
    }
  }

  async function iniciarProtecaoDocumentos() {
    setAviso(null);
    const { data: fatores, error } = await supabase.auth.mfa.listFactors();
    if (error) return setAviso("Não foi possível preparar a proteção dos documentos agora.");
    const fatorAtivo = fatores.totp.find((fator) => fator.status === "verified");
    if (fatorAtivo) {
      setProtecaoDocumentos({ factorId: fatorAtivo.id });
      return;
    }
    const { data: inscricao, error: erroInscricao } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Documentos privados TOC Brazil" });
    if (erroInscricao) return setAviso("Não foi possível iniciar a proteção dos documentos agora.");
    setProtecaoDocumentos({ factorId: inscricao.id, qr: inscricao.totp.qr_code, secret: inscricao.totp.secret });
  }

  async function confirmarProtecaoDocumentos() {
    if (!protecaoDocumentos || codigoDocumentos.length !== 6) return;
    setAviso(null);
    const { data: desafio, error: erroDesafio } = await supabase.auth.mfa.challenge({ factorId: protecaoDocumentos.factorId });
    if (erroDesafio) return setAviso("Não foi possível validar o código agora.");
    const { error } = await supabase.auth.mfa.verify({ factorId: protecaoDocumentos.factorId, challengeId: desafio.id, code: codigoDocumentos });
    if (error) return setAviso("Código inválido ou expirado.");
    setCodigoDocumentos("");
    setProtecaoDocumentos(null);
    setDocumentosDesbloqueados(true);
    setAviso("Documentos privados desbloqueados nesta sessão.");
  }

  async function abrirDocumentoPrivado(id: string) {
    const novaAba = window.open("about:blank", "_blank");
    try {
      const resultado = await abrirDocumento({ data: { id } });
      if (resultado.ok) {
        if (novaAba) novaAba.location.href = resultado.url;
        else setAviso("O navegador bloqueou a nova aba. Permita novas abas para este site e tente novamente.");
        return;
      }
      novaAba?.close();
      setAviso(resultado.erro);
      if (resultado.erro.includes("aplicativo autenticador")) await iniciarProtecaoDocumentos();
    } catch {
      novaAba?.close();
      setAviso("Não foi possível abrir o documento. Tente novamente.");
    }
  }

  const itensConferencia = [
    ["identity_matches", "Nome e CPF do documento conferem com o cadastro"],
    ["crp_active", "Inscrição no CRP ativa e regular"],
    ["certificate_valid", "Certidão de regularidade dentro da validade"],
    ["diploma_matches", "Diploma de graduação confere"],
    ["annex_v_compliant", "Perfil conforme o Anexo V: sem promessa de resultado, sem índice de sucesso, sem comparação com outros profissionais, “especialista” apenas com título registrado, e sem telefone, e-mail, rede social, site pessoal ou chave de pagamento em qualquer campo"],
  ] as const;

  const ABAS: [Aba, string][] = [
    ["visao", "Visão geral"],
    ["pacientes", "Pacientes"],
    ["profissionais", `Profissionais${t?.pendentes ? ` (${t.pendentes})` : ""}`],
    ["consultas", "Consultas"],
    ["financeiro", "Extrato financeiro"],
    ["asaas", "Testes Asaas"],
    ["relatorio", "Relatório"],
    ["configuracoes", "Configurações"],
  ];

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Gestão</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Painel do gestor</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Visão geral da plataforma, análise dos cadastros profissionais, pacientes, consultas, taxa fixa e
        pagamentos. Dados clínicos dos pacientes não são acessíveis pela gestão.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1 text-sm">
          {ABAS.map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAba(id)}
              className={`rounded-full px-4 py-2 ${aba === id ? "bg-background font-semibold" : "text-muted-foreground"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {aba !== "visao" && aba !== "configuracoes" && (
          <input
            className="field-base max-w-xs"
            placeholder="Buscar por nome, e-mail ou registro"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar"
          />
        )}
      </div>

      {aviso && (
        <p className="card-soft mt-6 p-4 text-sm" role="status">
          {aviso}
        </p>
      )}
      {painel.isLoading && <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>}

      {aba === "visao" && t && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { rotulo: "Pacientes cadastrados", valor: String(t.pacientes) },
              { rotulo: "Profissionais cadastrados", valor: String(t.profissionais) },
              { rotulo: "Profissionais ativos", valor: String(t.profissionaisAtivos) },
              { rotulo: "Cadastros pendentes", valor: String(t.pendentes), destaque: t.pendentes > 0 },
              { rotulo: "Perfis sinalizados", valor: String(t.perfisSinalizados), destaque: t.perfisSinalizados > 0 },
              { rotulo: "Consultas futuras", valor: String(t.consultasFuturas) },
              { rotulo: "Consultas realizadas", valor: String(t.consultasRealizadas) },
              { rotulo: "Taxas fixas registradas", valor: moeda(t.taxasRegistradasCentavos) },
              { rotulo: "Taxa fixa em realizadas", valor: moeda(t.taxasRealizadasCentavos) },
              { rotulo: "Valores pendentes de confirmação", valor: moeda(t.valorConsultasPendentesCentavos), destaque: t.valorConsultasPendentesCentavos > 0 },
            ].map((item) => (
              <div key={item.rotulo} className={`card-soft p-5 ${item.destaque ? "border-primary/50" : ""}`}>
                <p className="section-label">{item.rotulo}</p>
                <p className="mt-2 font-display text-2xl">{item.valor}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button type="button" className="card-soft p-5 text-left hover:border-primary/60" onClick={() => { setAba("profissionais"); setFiltroProf("pendente"); }}>
              <p className="font-semibold">Analisar cadastros pendentes</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.pendentes} profissional(is) aguardando validação.</p>
            </button>
            <button type="button" className="card-soft p-5 text-left hover:border-primary/60" onClick={() => setAba("financeiro")}>
              <p className="font-semibold">Extrato financeiro</p>
              <p className="mt-1 text-sm text-muted-foreground">{moeda(t.valorConsultasPendentesCentavos)} em consultas realizadas pendentes de confirmação financeira.</p>
            </button>
          </div>
        </>
      )}

      {aba === "pacientes" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Cadastro</th>
                <th className="p-3">Status</th>
                <th className="p-3">Consultas</th>
                <th className="p-3">Total pago</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="p-3">
                    <p className="font-semibold">{u.nome ?? "—"}</p>
                    {u.codigo && <p className="text-xs text-muted-foreground">{u.codigo}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{dataBR(u.criadoEm)}</td>
                  <td className="p-3">{u.cadastroCompleto ? "Completo" : "Incompleto"}</td>
                  <td className="p-3">
                    {u.consultas} <span className="text-xs text-muted-foreground">({u.consultasRealizadas} realizadas)</span>
                  </td>
                  <td className="p-3 font-semibold">{moeda(u.pagoCentavos)}</td>
               </tr>
              ))}
              {pacientes.length === 0 && !painel.isLoading && (
                <tr><td colSpan={6} className="p-4 text-muted-foreground">Nenhum paciente encontrado.</td></tr>
              )}
            </tbody>
          </table>
          <p className="p-3 text-xs text-muted-foreground">
            Os e-mails acima podem ser usados para comunicações e newsletter, respeitando o consentimento dado no cadastro.
          </p>
        </div>
      )}

      {aba === "relatorio" && (
        <section className="card-soft mt-6 overflow-x-auto p-4">
          <h2 className="text-xl">Indicadores agregados por profissional</h2>
          <p className="mt-2 text-sm text-muted-foreground">Alertas usam desvio de dois desvios-padrão e servem apenas para revisão operacional.</p>
          <table className="mt-4 w-full min-w-[52rem] text-sm"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Profissional</th><th className="p-2">Primeiras</th><th className="p-2">Retornos</th><th className="p-2">Taxa</th><th className="p-2">Cancelamentos tardios</th><th className="p-2">Detecções</th><th className="p-2">Continuidade</th><th className="p-2">Alertas</th></tr></thead><tbody>{(indicadores.data?.indicadores ?? []).map((i) => <tr key={i.professional_id} className="border-t border-border/60"><td className="p-2 font-semibold">{i.nome}</td><td className="p-2">{i.pacientes_primeira_consulta}</td><td className="p-2">{i.pacientes_retorno}</td><td className="p-2">{Math.round(Number(i.taxa_retorno) * 100)}%</td><td className="p-2">{i.cancelamentos_tardios}</td><td className="p-2">{i.deteccoes}</td><td className="p-2">{i.continuidades}</td><td className="p-2">{i.alerta_cancelamento || i.alerta_retorno ? "Revisar" : "—"}</td></tr>)}</tbody></table>
        </section>
      )}

      {aba === "profissionais" && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["pendente", "Em análise"],
                ["aprovado", "Aprovados"],
                ["rejeitado", "Rejeitados"],
                ["suspenso", "Suspensos"],
                ["todos", "Todos"],
                ["descredenciado", "Excluídos"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltroProf(id)}
                className={`pill ${filtroProf === id ? "bg-primary text-primary-foreground" : ""}`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {profissionais.map((p) => (
              <article key={p.id} className="card-soft p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg">{p.nome}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Psicólogo(a) · {p.registro} · {p.uf}
                      · cadastro em {dataBR(p.criadoEm)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Etapa atual: <strong className="text-foreground">{p.etapa.titulo}</strong> · {p.documentos.filter((d) => d.status === "aprovado").length}/{p.documentos.length} documentos aprovados · {p.consultas} consultas
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="pill">{rotuloStatusProf[p.status] ?? p.status}</span>
                    <span className="text-[11px] text-muted-foreground">{p.status === "aprovado" && p.temAgenda ? "Perfil ativo" : "Perfil inativo"}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <EtapasCadastro etapaAtual={p.etapa} compacto />
                </div>

                <button
                  type="button"
                  className="btn-base btn-ghost mt-4"
                  aria-expanded={aberto === p.id}
                  onClick={() => setAberto(aberto === p.id ? null : p.id)}
                >
                  {aberto === p.id ? "Fechar análise" : "Abrir análise"}
                </button>

                {aberto === p.id && (
                  <div className="mt-6 space-y-6">
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <Info rotulo="Preço da consulta" valor={moeda(p.valor_centavos)} />
                      <Info rotulo="Valor do profissional" valor={moeda(Math.max(p.valor_centavos - 2700, 0))} />
                      <Info rotulo="Tipo de cadastro" valor={p.tipo_pessoa === "PJ" ? "Pessoa jurídica" : "Pessoa física"} />
                      <Info rotulo="CPF" valor={p.cpf ?? "—"} />
                      {p.tipo_pessoa === "PJ" && <Info rotulo="CNPJ" valor={p.cnpj ?? "—"} />}
                      <Info
                        rotulo="Ferramenta de videochamada"
                        valor={
                          p.ferramenta_url_sala
                            ? [p.ferramenta_provedor, p.ferramenta_url_sala].filter(Boolean).join(" · ")
                            : "não cadastrada — impede a publicação"
                        }
                      />
                      <Info
                        rotulo="Certidão do conselho (validade)"
                        valor={p.certidao_validade ? dataBR(p.certidao_validade) : "—"}
                      />
                      <Info rotulo="Seguro opcional" valor={[p.seguradora_nome, p.apolice_numero, p.apolice_validade ? dataBR(p.apolice_validade) : null].filter(Boolean).join(" · ") || "Não informado"} />

                      <Info rotulo="Abordagens" valor={p.abordagens_publicas.join(", ")} />
                      <Info rotulo="Formação" valor={p.formacoes_publicas.map((f) => `${f.curso} — ${f.instituicao}, ${f.ano}`).join("; ")} />
                      <Info rotulo="Áreas de experiência" valor={p.areas.join(", ")} />
                      <Info rotulo="Idiomas" valor={p.idiomas.join(", ")} />
                      <Info rotulo="Biografia" valor={p.biografia_publica} />
                      <Info rotulo="Experiência com TOC" valor={p.temas_toc_publicos.join(", ")} />
                      <Info rotulo="Bloqueios antidesvio" valor={String(p.perfil_bloqueios_contato)} />
                      <Info rotulo="Última validação" valor={p.validado_em ? dataHoraBR(p.validado_em) : "—"} />
                      <Info rotulo="Conferência cadastral" valor={p.cadastro_conferido_em ? dataHoraBR(p.cadastro_conferido_em) : "Pendente"} />
                      <Info rotulo="Contrato" valor={p.contrato_aceito_em ? `${p.contrato_versao} · aceito em ${dataHoraBR(p.contrato_aceito_em)}` : "Aguardando aceite"} />
                    </dl>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="text-base font-semibold">Foto do perfil</h3>
                      {p.foto_url ? <img src={p.foto_url} alt={`Foto enviada por ${p.nome}`} className="mt-3 aspect-square w-48 rounded-lg object-cover" /> : <p className="mt-2 text-sm text-muted-foreground">Nenhuma foto enviada.</p>}
                      <p className="mt-2 text-sm">Situação: <strong>{p.foto_status}</strong></p>
                      <p className="mt-1 text-xs text-muted-foreground">Confira rosto visível, imagem recente e ausência de texto, telefone, arroba ou logotipo.</p>
                      {p.foto_url && <div className="mt-3 flex gap-2"><button type="button" className="btn-base btn-primary" onClick={async () => { await mudarStatusFoto({ data: { id: p.id, status: "aprovada" } }); await atualizar(); }}>Aprovar foto</button><button type="button" className="btn-base btn-ghost" onClick={async () => { await mudarStatusFoto({ data: { id: p.id, status: "recusada", observacao: "Envie uma foto sem texto, contato, arroba ou logotipo." } }); await atualizar(); }}>Recusar foto</button></div>}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold">Documentos e títulos</h3>
                      {!documentosDesbloqueados && !protecaoDocumentos && <div className="mt-3 rounded-lg border border-border bg-muted p-4"><p className="text-sm text-muted-foreground">Por segurança, os documentos privados exigem um código do aplicativo autenticador somente no momento da abertura.</p><Button type="button" variant="outline" className="mt-3" onClick={() => void iniciarProtecaoDocumentos()}>Desbloquear documentos</Button></div>}
                      {protecaoDocumentos && <div className="mt-3 rounded-lg border border-border bg-muted p-4"><p className="text-sm font-semibold">Proteção dos documentos privados</p>{protecaoDocumentos.qr && <><img src={protecaoDocumentos.qr} alt="Código QR para proteger o acesso aos documentos" className="mt-4 size-48" /><p className="mt-2 break-all text-xs text-muted-foreground">Chave manual: {protecaoDocumentos.secret}</p></>}<label className="mt-4 block text-sm">Código de seis dígitos<input className="field-base mt-2 max-w-xs" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={codigoDocumentos} onChange={(event) => setCodigoDocumentos(event.target.value.replace(/\D/g, ""))} /></label><Button type="button" className="mt-3" disabled={codigoDocumentos.length !== 6} onClick={() => void confirmarProtecaoDocumentos()}>Confirmar e desbloquear</Button></div>}
                      {p.documentos.length === 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">Nenhum documento enviado até agora.</p>
                      )}
                      <ul className="mt-3 space-y-3">
                        {p.documentos.map((d) => (
                          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-sm">
                            <div>
                              <p className="font-semibold">{d.tipo}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.nome_arquivo} · {dataHoraBR(d.created_at)} · {rotuloDoc[d.status] ?? d.status}
                                {d.observacao_admin ? ` · ${d.observacao_admin}` : ""}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className="btn-base btn-ghost px-4 py-2" onClick={() => void abrirDocumentoPrivado(d.id)}>Abrir documento</button>
                              <select
                                className="field-base"
                                aria-label={`Situação do documento ${d.nome_arquivo}`}
                                value={d.status}
                                onChange={async (e) => {
                                  await mudarStatusDoc({ data: { id: d.id, status: e.target.value as "enviado" | "aprovado" | "recusado" } });
                                  await atualizar();
                                }}
                              >
                                <option value="enviado">Enviado</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="recusado">Recusado</option>
                              </select>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <EdicaoProfissional profissional={p} salvar={async (conteudo) => {
                      const resultado = await editarProf({ data: { id: p.id, ...conteudo } });
                      setAviso(resultado.ok ? "Informações atualizadas. O cadastro voltou para análise." : resultado.erro);
                      if (resultado.ok) await atualizar();
                      return resultado.ok;
                    }} />

                    <div>
                      <label htmlFor={`obs-${p.id}`} className="section-label">
                        Observação da análise (visível ao profissional)
                      </label>
                      <textarea
                        id={`obs-${p.id}`}
                        rows={3}
                        className="field-base mt-2"
                        value={observacao[p.id] ?? p.observacao_admin ?? ""}
                        onChange={(e) => setObservacao({ ...observacao, [p.id]: e.target.value })}
                      />
                    </div>

                    {!p.cadastro_conferido_em && <fieldset className="rounded-lg border border-border p-4">
                      <legend className="px-1 text-base font-semibold">Checklist da conferência</legend>
                      <div className="mt-3 space-y-3">{itensConferencia.map(([chave, rotulo]) => <label key={chave} className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1" checked={checklists[p.id]?.[chave] ?? false} onChange={(event) => setChecklists((atual) => ({ ...atual, [p.id]: { ...atual[p.id], [chave]: event.target.checked } }))} /><span>{rotulo}</span></label>)}</div>
                    </fieldset>}

                    {p.status !== "descredenciado" && <div className="flex flex-wrap gap-3">
                      {!p.cadastro_conferido_em && <button type="button" className="btn-base btn-primary" onClick={async () => {
                        const checklist = checklists[p.id] ?? {};
                        const resultado = await conferirCadastro({ data: { id: p.id, checklist: { identity_matches: checklist["identity_matches"] === true, crp_active: checklist["crp_active"] === true, certificate_valid: checklist["certificate_valid"] === true, diploma_matches: checklist["diploma_matches"] === true, annex_v_compliant: checklist["annex_v_compliant"] === true } } });
                        setAviso(resultado.ok ? "Cadastro aprovado. O contrato foi liberado para aceite." : resultado.erro);
                        await atualizar();
                      }} disabled={!itensConferencia.every(([chave]) => checklists[p.id]?.[chave])}>Aprovar e liberar contrato</button>}
                      <button type="button" className="btn-base btn-primary" onClick={() => aplicarStatus(p, "aprovado")}>
                        Publicar após assinatura
                      </button>
                      <button type="button" className="btn-base btn-ghost" disabled={!String(observacao[p.id] ?? p.observacao_admin ?? "").trim()} onClick={() => aplicarStatus(p, "pendente", true)}>
                        Solicitar correção
                      </button>
                      <button type="button" className="btn-base btn-ghost" onClick={() => aplicarStatus(p, "pendente", false)}>
                        Voltar para análise
                      </button>
                      <button type="button" className="btn-base btn-ghost" disabled={!String(observacao[p.id] ?? p.observacao_admin ?? "").trim()} onClick={() => aplicarStatus(p, "rejeitado")}>
                        Rejeitar
                      </button>
                      <button type="button" className="btn-base btn-ghost" onClick={() => aplicarStatus(p, "suspenso")}>
                        Suspender
                      </button>
                      <Button type="button" variant="destructive" disabled={excluindo === p.id} onClick={() => void confirmarExclusao(p)}>
                        {excluindo === p.id ? "Excluindo…" : "Excluir profissional"}
                      </Button>
                    </div>}
                    {p.documentos.some((d) => d.status !== "aprovado") && (
                      <p className="text-xs text-muted-foreground">
                        Atenção: ainda há documentos não aprovados. O perfil só deve ser publicado após a aprovação de todos os requisitos.
                      </p>
                    )}

                    {p.historico.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold">Histórico de alterações</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                          {p.historico.map((h) => (
                            <li key={h.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-surface px-4 py-2">
                              <span>
                                {h.status_anterior ? `${rotuloStatusProf[h.status_anterior] ?? h.status_anterior} → ` : ""}
                                <strong>{rotuloStatusProf[h.status_novo] ?? h.status_novo}</strong>
                                {h.requer_correcao ? " (correção solicitada)" : ""}
                                {h.observacao ? ` — ${h.observacao}` : ""}
                              </span>
                              <span className="text-muted-foreground">{dataHoraBR(h.created_at)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {p.decisoes.length > 0 && <div><h3 className="text-base font-semibold">Decisões de conferência</h3><ul className="mt-3 space-y-2 text-sm">{p.decisoes.map((decisao) => <li key={decisao.id} className="rounded-xl bg-surface px-4 py-3"><div className="flex flex-wrap justify-between gap-2"><strong>{decisao.decision === "approved" ? "Aprovado" : decisao.decision === "correction_requested" ? "Correção solicitada" : "Reprovado"}</strong><span className="text-muted-foreground">{dataHoraBR(decisao.decided_at)}</span></div>{decisao.reason && <p className="mt-1 text-muted-foreground">{decisao.reason}</p>}</li>)}</ul></div>}

                  </div>
                )}
              </article>
            ))}
            {profissionais.length === 0 && !painel.isLoading && (
              <p className="card-soft p-6 text-sm text-muted-foreground">Nenhum profissional nesta situação.</p>
            )}
          </div>
        </>
      )}

      {aba === "consultas" && (
        <div className="card-soft mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[64rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Profissional</th>
                <th className="p-3">Reserva</th>
                <th className="p-3">Consulta</th>
                <th className="p-3">Plataforma</th>
                <th className="p-3">Profissional recebe</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="p-3">{dataHoraBR(c.inicio)}</td>
                  <td className="p-3 font-semibold">{c.paciente}</td>
                  <td className="p-3">{c.profissional}</td>
                  <td className="p-3">{moeda(c.taxa_centavos)}</td>
                  <td className="p-3">{moeda(c.valor_consulta_centavos)}</td>
                  <td className="p-3">{moeda(c.valor_plataforma_centavos)}</td>
                  <td className="p-3">{c.status === "realizada" ? moeda(c.valor_profissional_centavos) : <span className="text-muted-foreground">após acontecer</span>}</td>
                  <td className="p-3">
                    <select
                      className="field-base py-1.5"
                      aria-label={`Status do pagamento de ${c.paciente}`}
                      value={c.payment_status}
                      onChange={async (e) => {
                        await mudarPagamento({ data: { id: c.id, status: e.target.value as "pendente" | "aprovado" | "recusado" | "estornado" } });
                        await atualizar();
                      }}
                    >
                      {Object.entries(rotuloPagamento).filter(([v]) => v !== "cancelado").map(([v, r]) => (
                        <option key={v} value={v}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      className="field-base py-1.5"
                      aria-label={`Status da consulta de ${c.paciente}`}
                      value={c.status}
                      onChange={async (e) => {
                        await mudarConsulta({ data: { id: c.id, status: e.target.value as "confirmada" | "realizada" | "cancelada" | "nao_compareceu" | "aguardando_pagamento" } });
                        await atualizar();
                      }}
                    >
                      {["aguardando_pagamento", "confirmada", "realizada", "nao_compareceu", "cancelada"].map((v) => (
                        <option key={v} value={v}>{rotuloStatusConsulta[v]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {consultas.length === 0 && !painel.isLoading && (
                <tr><td colSpan={9} className="p-4 text-muted-foreground">Nenhuma consulta encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {aba === "financeiro" && t && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { rotulo: "Taxas fixas registradas", valor: moeda(t.taxasRegistradasCentavos) },
              { rotulo: "Taxa fixa em realizadas", valor: moeda(t.taxasRealizadasCentavos) },
              { rotulo: "Valores pendentes de confirmação", valor: moeda(t.valorConsultasPendentesCentavos) },
              { rotulo: "Valores com pagamento aprovado", valor: moeda(t.valorConsultasAprovadasCentavos) },
            ].map((i) => (
              <div key={i.rotulo} className="card-soft p-5">
                <p className="section-label">{i.rotulo}</p>
                <p className="mt-2 font-display text-2xl">{i.valor}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl">Extrato por profissional</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registro de consultas realizadas, preço do profissional e taxa fixa da plataforma.
              </p>
            </div>
            <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
              {(
                [
                  ["pendente", "Pendentes"],
                  ["aprovado", "Aprovados"],
                  ["todos", "Todos"],
                ] as const
              ).map(([id, rotulo]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltroPagamento(id)}
                  className={`rounded-full px-3 py-1.5 ${filtroPagamento === id ? "bg-background font-semibold" : "text-muted-foreground"}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
          <div className="card-soft mt-4 overflow-x-auto p-2">
            <table className="w-full min-w-[64rem] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Profissional</th>
                  <th className="p-3">Consulta</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Preço da consulta</th>
                  <th className="p-3">Taxa fixa</th>
                  <th className="p-3">Valor do profissional</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosVisiveis.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="p-3 font-semibold">{r.profissional}</td>
                    <td className="p-3">{r.consultaInicio ? dataHoraBR(r.consultaInicio) : "—"}</td>
                    <td className="p-3">{r.previstoPara ? dataBR(r.previstoPara) : "—"}</td>
                    <td className="p-3">{moeda(r.bruto)}</td>
                    <td className="p-3 text-muted-foreground">{moeda(r.plataforma)}</td>
                    <td className="p-3 font-semibold">{moeda(r.liquido)}</td>
                    <td className="p-3">
                      <span className="pill">{rotuloPagamento[r.status] ?? r.status}</span>
                      {r.pagoEm && <p className="mt-1 text-[11px] text-muted-foreground">aprovado em {dataBR(r.pagoEm)}</p>}
                    </td>
                  </tr>
                ))}
                {pagamentosVisiveis.length === 0 && !painel.isLoading && (
                  <tr><td colSpan={7} className="p-4 text-muted-foreground">Nenhum pagamento neste filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === "asaas" && <AsaasAdminLab />}

      {aba === "relatorio" && (
        <section className="mt-6">
          <h2 className="text-xl">Relatório de metadados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultas realizadas, cancelamentos, faltas e taxas por profissional nos últimos meses.
            Nenhuma informação de atendimento é registrada.
          </p>
          {relatorio.isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Profissional</th>
                  <th className="p-3">Realizadas</th>
                  <th className="p-3">Cancel. paciente</th>
                  <th className="p-3">Cancel. profissional</th>
                  <th className="p-3">Faltas</th>
                  <th className="p-3">Reservas expiradas</th>
                  <th className="p-3">Taxas devidas</th>
                </tr>
              </thead>
              <tbody>
                {(relatorio.data?.linhas ?? []).map((l) => (
                  <tr key={l.professional_id} className="border-t border-border/60">
                    <td className="p-3">{l.nome}</td>
                    <td className="p-3">{l.realizadas}</td>
                    <td className="p-3">{l.canceladas_paciente}</td>
                    <td className="p-3">{l.canceladas_profissional}</td>
                    <td className="p-3">{l.nao_comparecimentos}</td>
                    <td className="p-3">{l.expiradas}</td>
                    <td className="p-3 font-semibold">{moeda(l.taxas_centavos)}</td>
                  </tr>
                ))}
                {!relatorio.isLoading && (relatorio.data?.linhas ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-muted-foreground">
                      Nenhum profissional cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 className="mt-10 text-lg">Últimos eventos registrados</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {(relatorio.data?.eventos ?? []).map((e) => (
              <li key={e.id} className="card-soft flex flex-wrap justify-between gap-3 p-4">
                <span>{e.tipo.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">
                  {e.ator_papel ?? "sistema"} ·{" "}
                  {new Date(e.ocorrido_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </span>
              </li>
            ))}
            {!relatorio.isLoading && (relatorio.data?.eventos ?? []).length === 0 && (
              <li className="text-muted-foreground">Nenhum evento no período.</li>
            )}
          </ul>
        </section>
      )}


      {aba === "configuracoes" && dados && (
        <FormularioConfiguracoes
          inicial={dados.configuracoes}
          salvar={async (cfg) => {
            const r = await salvarCfg({ data: cfg });
            setAviso(r.ok ? "Configurações salvas." : r.erro);
            await atualizar();
          }}
        />
      )}
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="section-label">{rotulo}</dt>
      <dd className="mt-1 leading-relaxed text-muted-foreground">{valor || "—"}</dd>
    </div>
  );
}

function FormularioConfiguracoes({
  inicial,
  salvar,
}: {
  inicial: ConfiguracoesPlataforma;
  salvar: (cfg: Partial<ConfiguracoesPlataforma>) => Promise<void>;
}) {
  const [cfg, setCfg] = useState(inicial);
  useEffect(() => setCfg(inicial), [inicial]);
  const num = (chave: keyof ConfiguracoesPlataforma, rotulo: string, dica: string, escala = 1) => (
    <label className="block text-sm">
      {rotulo}
      <input
        type="number"
        step="any"
        className="field-base mt-1"
        value={Number(cfg[chave]) / escala}
        onChange={(e) => setCfg({ ...cfg, [chave]: Math.round(Number(e.target.value) * escala) })}
      />
      <span className="mt-1 block text-xs text-muted-foreground">{dica}</span>
    </label>
  );
  return (
    <form
      className="card-soft mt-6 grid gap-5 p-7 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await salvar(cfg);
      }}
    >
      <h2 className="text-xl sm:col-span-2">Regras financeiras e operacionais</h2>
      {num("taxaPorConsultaCentavos", "Taxa fixa por consulta realizada (R$)", "Descontada do valor da consulta e devida pelo profissional, igual para todos.", 100)}
      {num("duracaoPadraoMinutos", "Duração padrão (minutos)", "Usada quando o profissional não define outra.")}
      {num("cancelamentoHoras", "Cancelamento sem custo até (horas antes)", "Prazo para o paciente cancelar com direito a estorno do pagamento.")}
      {num("remarcacaoHoras", "Remarcação até (horas antes)", "Prazo mínimo para remarcar.")}
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={cfg.reembolsoTaxaNoPrazo}
          onChange={(e) => setCfg({ ...cfg, reembolsoTaxaNoPrazo: e.target.checked })}
        />
        Estornar o pagamento quando o cancelamento é feito dentro do prazo
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-base btn-primary">
          Salvar configurações
        </button>
      </div>
    </form>
  );
}

function EdicaoProfissional({
  profissional,
  salvar,
}: {
  profissional: ProfissionalAdmin;
  salvar: (dados: {
    nome: string; tipo_pessoa: "PF" | "PJ"; cpf: string; cnpj: string; telefone: string; registro: string; uf: string;
    valor_centavos: number; experiencia_anos: number; abordagens_publicas: string; formacoes_publicas: string;
    temas_toc_publicos: string; biografia_publica: string; areas: string; idiomas: string;
    ferramenta_provedor: string; ferramenta_url_sala: string; ferramenta_instrucoes: string;
  }) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    nome: profissional.nome,
    tipo_pessoa: (profissional.tipo_pessoa === "PJ" ? "PJ" : "PF") as "PF" | "PJ",
    cpf: profissional.cpf ?? "",
    cnpj: profissional.cnpj ?? "",
    telefone: profissional.telefone ?? "",
    registro: profissional.registro,
    uf: profissional.uf,
    valor: String(profissional.valor_centavos / 100),
    experiencia_anos: String(profissional.experiencia_anos ?? 0),
    abordagens_publicas: profissional.abordagens_publicas.join(", "),
    formacoes_publicas: profissional.formacoes_publicas.map((item) => `${item.curso} | ${item.instituicao} | ${item.ano}`).join("\n"),
    temas_toc_publicos: profissional.temas_toc_publicos.join(", "),
    biografia_publica: profissional.biografia_publica ?? "",
    areas: profissional.areas.join(", "),
    idiomas: profissional.idiomas.join(", "),
    ferramenta_provedor: profissional.ferramenta_provedor ?? "",
    ferramenta_url_sala: profissional.ferramenta_url_sala ?? "",
    ferramenta_instrucoes: "",
  });
  const [salvo, setSalvo] = useState(false);

  return (
    <form
      className="rounded-2xl bg-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSalvo(false);
        const ok = await salvar({
          ...form,
          valor_centavos: Math.round((Number(form.valor) || 0) * 100),
          experiencia_anos: Number(form.experiencia_anos) || 0,
        });
        setSalvo(ok);
      }}
    >
      <h3 className="text-base font-semibold">Acrescentar ou corrigir informações</h3>
      <p className="mt-2 text-sm text-muted-foreground">As alterações ficam registradas e devolvem o cadastro para conferência. Documentos não são aprovados automaticamente.</p>
      <fieldset className="mt-4"><legend className="section-label">Tipo de cadastro</legend><div className="mt-2 flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={form.tipo_pessoa === "PF"} onChange={() => setForm({ ...form, tipo_pessoa: "PF", cnpj: "" })} />Pessoa física</label><label className="flex items-center gap-2"><input type="radio" checked={form.tipo_pessoa === "PJ"} onChange={() => setForm({ ...form, tipo_pessoa: "PJ" })} />Pessoa jurídica</label></div></fieldset>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(
          [
            ["nome", "Nome"],
            ["cpf", "CPF"],
            ["telefone", "Telefone administrativo"],
            ["registro", "Registro profissional (CRP)"],
            ["uf", "UF do registro"],
            ["valor", "Valor da consulta (R$)"],
            ["experiencia_anos", "Anos de experiência"],
            ["abordagens_publicas", `Abordagens (${ABORDAGENS_PERFIL.join(", ")})`],
            ["temas_toc_publicos", `Experiência com TOC (${TEMAS_TOC_PERFIL.join(", ")})`],
            ["areas", "Áreas de experiência (vírgulas)"],
            ["idiomas", `Idiomas (${IDIOMAS_PERFIL.join(", ")})`],
            ["ferramenta_provedor", "Provedor da sala virtual"],
            ["ferramenta_url_sala", "Endereço HTTPS da sala virtual"],
          ] as const
        ).map(([campo, rotulo]) => (
          <div key={campo}>
            <label htmlFor={`${campo}-${profissional.id}`} className="section-label">
              {rotulo}
            </label>
            <input
              id={`${campo}-${profissional.id}`}
              className="field-base mt-2"
              value={form[campo]}
              onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
            />
          </div>
        ))}
        {form.tipo_pessoa === "PJ" && <div><label htmlFor={`cnpj-${profissional.id}`} className="section-label">CNPJ</label><input id={`cnpj-${profissional.id}`} className="field-base mt-2" value={form.cnpj} onChange={(event) => setForm({ ...form, cnpj: event.target.value })} /></div>}
        <div className="sm:col-span-2">
          <label htmlFor={`formacoes-${profissional.id}`} className="section-label">Formações — uma por linha: Curso | Instituição | Ano</label>
          <textarea
            id={`formacoes-${profissional.id}`}
            rows={3}
            className="field-base mt-2"
            value={form.formacoes_publicas}
            onChange={(e) => setForm({ ...form, formacoes_publicas: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`biografia-${profissional.id}`} className="section-label">Biografia pública</label>
          <textarea
            id={`biografia-${profissional.id}`}
            rows={3}
            className="field-base mt-2"
            maxLength={600}
            value={form.biografia_publica}
            onChange={(e) => setForm({ ...form, biografia_publica: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2"><label htmlFor={`instrucoes-${profissional.id}`} className="section-label">Instruções da sala virtual</label><textarea id={`instrucoes-${profissional.id}`} rows={3} className="field-base mt-2" value={form.ferramenta_instrucoes} onChange={(event) => setForm({ ...form, ferramenta_instrucoes: event.target.value })} /></div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn-base btn-primary">Salvar alterações</button>
        {salvo && <span className="text-sm font-semibold">Alterações salvas.</span>}
      </div>
    </form>
  );
}
