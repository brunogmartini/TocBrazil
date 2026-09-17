import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  meuCadastroProfissional,
  registrarDocumento,
  removerDocumento,
  salvarCadastroProfissional,
  salvarDadosPagamento,
} from "@/lib/profissional.functions";
import {
  desvincularMercadoPago,
  iniciarVinculoMercadoPago,
  statusVinculoMercadoPago,
} from "@/lib/mercadopago.functions";
import { ProfessionalNav } from "@/components/professional-nav";
import { exigirAreaProfissional } from "@/lib/role-access";
import { moeda } from "@/lib/video-sala";


export const Route = createFileRoute("/_authenticated/profissional/cadastro")({
  beforeLoad: () => exigirAreaProfissional(),
  head: () => ({
    meta: [
      { title: "Meu cadastro profissional — TOC Brazil" },
      {
        name: "description",
        content: "Complete seus dados, envie documentos para verificação e informe seu pagamento.",
      },
      { property: "og:title", content: "Meu cadastro profissional — TOC Brazil" },
      {
        property: "og:description",
        content: "Dados profissionais, documentos e dados de pagamento na TOC Brazil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CadastroProfissional,
});

const TIPOS_DOCUMENTO = [
  "Documento de identidade",
  "Certidão de regularidade do CRP",
  "Apólice de seguro de responsabilidade civil profissional",
  "Diploma de graduação",
  "Certificado de formação",
];

const rotuloDoc: Record<string, string> = {
  enviado: "Em análise",
  aprovado: "Aprovado",
  recusado: "Requer reenvio",
};

function CadastroProfissional() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(meuCadastroProfissional);
  const salvar = useServerFn(salvarCadastroProfissional);
  const salvarPagamento = useServerFn(salvarDadosPagamento);
  const registrar = useServerFn(registrarDocumento);
  const remover = useServerFn(removerDocumento);
  const statusVinculo = useServerFn(statusVinculoMercadoPago);
  const iniciarVinculo = useServerFn(iniciarVinculoMercadoPago);
  const desvincular = useServerFn(desvincularMercadoPago);

  const dados = useQuery({ queryKey: ["cadastro-profissional"], queryFn: () => carregar() });
  const vinculo = useQuery({
    queryKey: ["vinculo-mercadopago"],
    queryFn: () => statusVinculo(),
  });


  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    registro: "",
    uf: "",
    cidade: "",
    telefone: "",
    email_contato: "",
    genero: "",
    abordagem: "",
    destaque: "",
    apresentacao: "",
    experiencia_toc: "",
    experiencia_anos: "0",
    slot_minutos: "50",
    valor: "200",
    graduacao: "",
    instituicao: "",
    cursos: "",
    formacao: "",

    especializacoes: "",
    areas: "",
    idiomas: "",
    certidao_validade: "",
    apolice_validade: "",
    ferramenta_provedor: "",
    ferramenta_url_sala: "",
    ferramenta_instrucoes: "",
  });
  const [pagamento, setPagamento] = useState({
    documento: "",
    chave_pix: "",
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "corrente",
  });
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoDoc, setTipoDoc] = useState(TIPOS_DOCUMENTO[0]!);
  const [enviandoDoc, setEnviandoDoc] = useState(false);

  useEffect(() => {
    const p = dados.data?.profissional;
    if (p) {
      setForm({
        nome: p.nome ?? "",
        cpf: p.cpf ?? "",
        registro: p.registro ?? "",
        uf: p.uf ?? "",
        cidade: p.cidade ?? "",
        telefone: p.telefone ?? "",
        email_contato: p.email_contato ?? dados.data?.email ?? "",
        genero: p.genero ?? "",
        abordagem: p.abordagem ?? "",
        destaque: p.destaque ?? "",
        apresentacao: p.apresentacao ?? "",
        experiencia_toc: p.experiencia_toc ?? "",
        experiencia_anos: String(p.experiencia_anos ?? 0),
        slot_minutos: String(p.slot_minutos ?? 50),
        valor: String(Math.round((p.valor_centavos ?? 20000) / 100)),
        graduacao: p.graduacao ?? "",
        instituicao: p.instituicao ?? "",
        cursos: (p.cursos ?? []).join(", "),
        formacao: (p.formacao ?? []).join(", "),

        especializacoes: (p.especializacoes ?? []).join(", "),
        areas: (p.areas ?? []).join(", "),
        idiomas: (p.idiomas ?? []).join(", "),
        certidao_validade: p.certidao_validade ?? "",
        apolice_validade: p.apolice_validade ?? "",
        ferramenta_provedor: p.ferramenta_provedor ?? "",
        ferramenta_url_sala: p.ferramenta_url_sala ?? "",
        ferramenta_instrucoes: p.ferramenta_instrucoes ?? "",
      });
    } else if (dados.data?.email) {
      setForm((f) => ({ ...f, email_contato: dados.data!.email! }));
    }
    const r = dados.data?.pagamento;
    if (r) {
      setPagamento({
        documento: r.documento ?? "",
        chave_pix: r.chave_pix ?? "",
        banco: r.banco ?? "",
        agencia: r.agencia ?? "",
        conta: r.conta ?? "",
        tipo_conta: r.tipo_conta ?? "corrente",
      });
    }
  }, [dados.data]);

  useEffect(() => {
    const situacao = new URLSearchParams(window.location.search).get("recebimento");
    if (!situacao) return;
    if (situacao === "ok") setAviso("Conta Mercado Pago ligada com sucesso.");
    else if (situacao === "cancelado") setAviso("A autorização no Mercado Pago foi cancelada.");
    else setAviso("Não conseguimos ligar sua conta Mercado Pago. Tente novamente.");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);


  async function enviarCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    try {
      const { valor, ...restoForm } = form;
      const r = await salvar({
        data: {
          ...restoForm,
          profissao: "psicologo",
          experiencia_anos: Number(form.experiencia_anos) || 0,
          slot_minutos: Number(form.slot_minutos) || 50,
          valor_centavos: Math.round((Number(valor) || 0) * 100),
        },
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setAviso("Cadastro salvo.");
      await queryClient.invalidateQueries();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar agora.");
    }
  }

  async function enviarPagamento(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const r = await salvarPagamento({ data: pagamento });
    if (!r.ok) setErro(r.erro);
    else setAviso("Dados de pagamento salvos.");
  }

  async function enviarArquivo(file: File) {
    setErro(null);
    setEnviandoDoc(true);
    try {
      const { data: sessao } = await supabase.auth.getUser();
      const uid = sessao.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const nomeSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
      const caminho = `${uid}/${Date.now()}-${nomeSeguro}`;
      const { error: erroUpload } = await supabase.storage
        .from("documentos-profissionais")
        .upload(caminho, file, { upsert: false });
      if (erroUpload) throw new Error("Não foi possível enviar o arquivo.");
      const r = await registrar({
        data: { tipo: tipoDoc, nome_arquivo: file.name, caminho },
      });
      if (!r.ok) throw new Error(r.erro);
      setAviso("Documento enviado para análise.");
      await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
    } finally {
      setEnviandoDoc(false);
    }
  }

  const temCadastro = Boolean(dados.data?.profissional);
  const documentos = dados.data?.documentos ?? [];

  return (
    <div className="professional-workspace py-12 lg:py-16">
    <div className="container-page">
      <div className="professional-heading p-6 sm:p-8">
        <span className="professional-label">Consultório digital</span>
        <h1 className="mt-3 text-3xl sm:text-4xl">
          {temCadastro ? "Atualizar meus dados" : "Meu cadastro profissional"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {temCadastro
            ? "Seus dados já estão salvos. Edite aqui apenas o que precisar alterar: perfil público, valor da consulta, documentos e dados de recebimento."
            : "Estas informações formam o seu perfil público. Os documentos são usados apenas para verificação e ficam visíveis somente para você e para a equipe da plataforma."}
        </p>
      </div>
      <ProfessionalNav ativo="/profissional/cadastro" />

      {dados.data?.profissional && (
        <div className="card-soft mt-6 p-5">
          <p className="section-label">Situação do seu cadastro</p>
          <p className="mt-2 text-sm font-semibold">
            {dados.data.profissional.status === "aprovado"
              ? "Aprovado — seu perfil está publicado na página pública de profissionais."
              : dados.data.profissional.status === "rejeitado"
                ? "Cadastro rejeitado. Veja a observação da equipe, ajuste os dados e salve novamente."
                : dados.data.profissional.status === "suspenso"
                  ? "Perfil suspenso temporariamente. Fale com a equipe da plataforma."
                  : "Recebemos seu cadastro. Ele está aguardando a validação da equipe e o perfil ainda não aparece publicamente."}
          </p>
          {dados.data.profissional.observacao_admin && (
            <p className="mt-2 text-sm text-muted-foreground">
              Observação da equipe: {dados.data.profissional.observacao_admin}
            </p>
          )}
        </div>
      )}

      {aviso && <p className="mt-6 text-sm font-semibold">{aviso}</p>}
      {erro && <p className="mt-6 text-sm font-semibold text-destructive">{erro}</p>}


      <form onSubmit={enviarCadastro} className="card-soft mt-8 grid gap-5 p-7 sm:grid-cols-2">
        <Campo
          label="Nome completo"
          value={form.nome}
          onChange={(v) => setForm({ ...form, nome: v })}
          className="sm:col-span-2"
          required
        />
        <Campo
          label="CPF"
          value={form.cpf}
          onChange={(v) => setForm({ ...form, cpf: v.replace(/\D/g, "").slice(0, 11) })}
          required
        />
        <Campo
          label="Registro profissional (CRP)"
          value={form.registro}
          onChange={(v) => setForm({ ...form, registro: v })}
          required
        />
        <Campo
          label="UF do registro"
          value={form.uf}
          onChange={(v) => setForm({ ...form, uf: v.toUpperCase().slice(0, 2) })}
          required
        />
        <Campo
          label="Cidade"
          value={form.cidade}
          onChange={(v) => setForm({ ...form, cidade: v })}
        />
        <Campo
          label="Telefone (WhatsApp)"
          value={form.telefone}
          onChange={(v) => setForm({ ...form, telefone: v })}
        />
        <Campo
          label="E-mail de contato"
          type="email"
          value={form.email_contato}
          onChange={(v) => setForm({ ...form, email_contato: v })}
        />
        <div>
          <label htmlFor="genero" className="section-label">
            Como você se identifica
          </label>
          <select
            id="genero"
            className="field-base mt-2"
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
          >
            <option value="">Prefiro não informar</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="nao-binario">Não binário</option>
          </select>
        </div>
        <div>
          <label htmlFor="duracao" className="section-label">
            Duração da consulta
          </label>
          <select
            id="duracao"
            className="field-base mt-2"
            value={form.slot_minutos}
            onChange={(e) => setForm({ ...form, slot_minutos: e.target.value })}
          >
            {[30, 40, 50, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutos
              </option>
            ))}
          </select>
        </div>
        <Campo
          label="Anos de experiência"
          type="number"
          value={form.experiencia_anos}
          onChange={(v) => setForm({ ...form, experiencia_anos: v })}
        />
        <div>
          <Campo
            label="Preço da sua consulta (R$)"
            type="number"
            value={form.valor}
            onChange={(v) => setForm({ ...form, valor: v })}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            O paciente vê exatamente este valor:{" "}
            <strong>{moeda(Math.round((Number(form.valor) || 0) * 100))}</strong>. A taxa fixa da
            plataforma é cobrada de você por consulta realizada e não entra no preço.
          </p>
        </div>
        <div>
          <label htmlFor="abordagem" className="section-label">
            Abordagem teórica principal
          </label>
          <input
            id="abordagem"
            list="abordagens-sugeridas"
            className="field-base mt-2"
            value={form.abordagem}
            onChange={(e) => setForm({ ...form, abordagem: e.target.value })}
          />
          <datalist id="abordagens-sugeridas">
            <option value="Exposição e Prevenção de Resposta (EPR)" />
            <option value="Terapia Cognitivo Comportamental" />
            <option value="Terapia de Aceitação e Compromisso" />
            <option value="Terapia Comportamental" />
            <option value="Psicanálise" />
            <option value="Humanista" />
          </datalist>
        </div>

        <Campo
          label="Frase de destaque do perfil"
          value={form.destaque}
          onChange={(v) => setForm({ ...form, destaque: v })}
          className="sm:col-span-2"
        />
        <Campo
          label="Graduação"
          value={form.graduacao}
          onChange={(v) => setForm({ ...form, graduacao: v })}
        />
        <Campo
          label="Instituição de graduação"
          value={form.instituicao}
          onChange={(v) => setForm({ ...form, instituicao: v })}
        />
        <Campo
          label="Formação (separe por vírgula)"
          value={form.formacao}
          onChange={(v) => setForm({ ...form, formacao: v })}
          className="sm:col-span-2"
        />
        <Campo
          label="Cursos relevantes (separe por vírgula)"
          value={form.cursos}
          onChange={(v) => setForm({ ...form, cursos: v })}
          className="sm:col-span-2"
        />

        <Campo
          label="Especializações (separe por vírgula)"
          value={form.especializacoes}
          onChange={(v) => setForm({ ...form, especializacoes: v })}
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <label htmlFor="idiomas" className="section-label">Idiomas</label>
          <input
            id="idiomas"
            list="idiomas-sugeridos"
            className="field-base mt-2"
            value={form.idiomas}
            onChange={(e) => setForm({ ...form, idiomas: e.target.value })}
            placeholder="Português, Espanhol, Inglês"
          />
          <datalist id="idiomas-sugeridos">
            <option value="Português" />
            <option value="Espanhol" />
            <option value="Inglês" />
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="apresentacao" className="section-label">
            Apresentação para o paciente
          </label>
          <textarea
            id="apresentacao"
            rows={5}
            className="field-base mt-2"
            value={form.apresentacao}
            onChange={(e) => setForm({ ...form, apresentacao: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="experiencia_toc" className="section-label">
            Sua experiência com TOC
          </label>
          <textarea
            id="experiencia_toc"
            rows={4}
            className="field-base mt-2"
            value={form.experiencia_toc}
            onChange={(e) => setForm({ ...form, experiencia_toc: e.target.value })}
          />
        </div>
        <Campo
          label="Validade da certidão do CRP"
          type="date"
          value={form.certidao_validade}
          onChange={(v) => setForm({ ...form, certidao_validade: v })}
        />
        <Campo
          label="Validade da apólice de seguro"
          type="date"
          value={form.apolice_validade}
          onChange={(v) => setForm({ ...form, apolice_validade: v })}
        />
        <fieldset className="sm:col-span-2 rounded-xl border border-border p-5">
          <legend className="section-label px-1">Ferramenta de videochamada</legend>
          <p className="mt-2 text-sm text-muted-foreground">
            A sala de videochamada é contratada e mantida por você. A TOC Brazil apenas transmite
            este link ao paciente no horário agendado. O preenchimento é obrigatório para o seu
            perfil ser publicado.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Campo
              label="Provedor (Google Meet, Zoom, Whereby, Doxy.me…)"
              value={form.ferramenta_provedor}
              onChange={(v) => setForm({ ...form, ferramenta_provedor: v })}
            />
            <Campo
              label="Endereço da sua sala (URL)"
              value={form.ferramenta_url_sala}
              onChange={(v) => setForm({ ...form, ferramenta_url_sala: v })}
            />
            <div className="sm:col-span-2">
              <label htmlFor="ferramenta_instrucoes" className="section-label">
                Instruções para o paciente
              </label>
              <textarea
                id="ferramenta_instrucoes"
                rows={3}
                className="field-base mt-2"
                value={form.ferramenta_instrucoes}
                onChange={(e) => setForm({ ...form, ferramenta_instrucoes: e.target.value })}
              />
            </div>
          </div>
        </fieldset>
        <button type="submit" className="btn-base btn-primary sm:col-span-2">
          Salvar cadastro
        </button>
      </form>
      <section className="mt-12">
        <h2 className="text-2xl">Documentos para verificação</h2>
        {!temCadastro ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Salve seu cadastro acima para liberar o envio de documentos.
          </p>
        ) : (
          <div className="card-soft mt-5 p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="tipo-doc" className="section-label">
                  Tipo de documento
                </label>
                <select
                  id="tipo-doc"
                  className="field-base mt-2"
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                >
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="arquivo" className="section-label">
                  Arquivo (PDF ou imagem, até 10 MB)
                </label>
                <input
                  id="arquivo"
                  type="file"
                  accept="application/pdf,image/*"
                  className="field-base mt-2"
                  disabled={enviandoDoc}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void enviarArquivo(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            {enviandoDoc && <p className="mt-4 text-sm text-muted-foreground">Enviando…</p>}

            <ul className="mt-6 space-y-3">
              {documentos.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</li>
              ) : (
                documentos.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm"
                  >
                    <span>
                      <strong className="font-semibold">{d.tipo}</strong> · {d.nome_arquivo}
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="pill">{rotuloDoc[d.status] ?? d.status}</span>
                      <button
                        type="button"
                        className="text-sm underline underline-offset-4"
                        onClick={async () => {
                          await remover({ data: { id: d.id } });
                          await queryClient.invalidateQueries({
                            queryKey: ["cadastro-profissional"],
                          });
                        }}
                      >
                        Remover
                      </button>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Receber direto na sua conta Mercado Pago</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Ao ligar sua conta Mercado Pago, o valor de cada consulta cai direto na sua conta e a
          plataforma retém apenas a taxa fixa combinada, de forma automática.
        </p>
        <div className="card-soft mt-5 p-7">
          {!vinculo.data?.configurado ? (
            <p className="text-sm text-muted-foreground">
              O recebimento ainda está sendo configurado pela plataforma. Enquanto isso, seus
              pagamentos são feitos pelos dados informados abaixo.
            </p>
          ) : vinculo.data.vinculado ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Conta ligada</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conta preparada para split: taxa fixa em reais por consulta realizada.
                </p>
              </div>
              <button
                type="button"
                className="btn-base btn-ghost"
                onClick={async () => {
                  await desvincular();
                  vinculo.refetch();
                  setAviso("Conta Mercado Pago desligada.");
                }}
              >
                Desligar conta
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-xl text-sm text-muted-foreground">
                {vinculo.data.temCadastro
                  ? "Sua conta ainda não está ligada. Você será levado ao Mercado Pago para autorizar o recebimento."
                  : "Salve seus dados profissionais acima antes de ligar a conta."}
              </p>
              <button
                type="button"
                disabled={!vinculo.data.temCadastro}
                className="btn-base btn-primary disabled:opacity-50"
                onClick={async () => {
                  const r = await iniciarVinculo({ data: { origem: window.location.origin } });
                  if (r.ok) window.location.href = r.link;
                  else setAviso(r.erro);
                }}
              >
                Ligar conta Mercado Pago
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Dados administrativos de pagamento</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Usamos estes dados apenas para identificação administrativa e suporte financeiro.
        </p>

        <form onSubmit={enviarPagamento} className="card-soft mt-5 grid gap-5 p-7 sm:grid-cols-2">
          <Campo
            label="CPF ou CNPJ"
            value={pagamento.documento}
            onChange={(v) => setPagamento({ ...pagamento, documento: v })}
          />
          <Campo
            label="Chave Pix"
            value={pagamento.chave_pix}
            onChange={(v) => setPagamento({ ...pagamento, chave_pix: v })}
          />
          <Campo
            label="Banco"
            value={pagamento.banco}
            onChange={(v) => setPagamento({ ...pagamento, banco: v })}
          />
          <div>
            <label htmlFor="tipo-conta" className="section-label">
              Tipo de conta
            </label>
            <select
              id="tipo-conta"
              className="field-base mt-2"
              value={pagamento.tipo_conta}
              onChange={(e) => setPagamento({ ...pagamento, tipo_conta: e.target.value })}
            >
              <option value="corrente">Conta corrente</option>
              <option value="poupanca">Conta poupança</option>
              <option value="pagamento">Conta de pagamento</option>
            </select>
          </div>
          <Campo
            label="Agência"
            value={pagamento.agencia}
            onChange={(v) => setPagamento({ ...pagamento, agencia: v })}
          />
          <Campo
            label="Conta (com dígito)"
            value={pagamento.conta}
            onChange={(v) => setPagamento({ ...pagamento, conta: v })}
          />
          <button type="submit" className="btn-base btn-primary sm:col-span-2">
            Salvar dados de pagamento
          </button>
        </form>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/profissional/agenda" className="btn-base btn-primary">
          Configurar minha agenda
        </Link>
        <Link to="/profissional" className="btn-base btn-ghost">
          Voltar para a área do profissional
        </Link>
      </div>
    </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className={className}>
      <label htmlFor={id} className="section-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className="field-base mt-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
