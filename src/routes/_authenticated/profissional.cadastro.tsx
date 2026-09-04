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
  salvarDadosRepasse,
} from "@/lib/profissional.functions";
import {
  desvincularMercadoPago,
  iniciarVinculoMercadoPago,
  statusVinculoMercadoPago,
} from "@/lib/mercadopago.functions";


export const Route = createFileRoute("/_authenticated/profissional/cadastro")({
  head: () => ({
    meta: [
      { title: "Meu cadastro profissional — TOC Brazil" },
      {
        name: "description",
        content: "Complete seus dados, envie documentos para verificação e informe seu repasse.",
      },
      { property: "og:title", content: "Meu cadastro profissional — TOC Brazil" },
      {
        property: "og:description",
        content: "Dados profissionais, documentos e dados de repasse na TOC Brazil.",
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
  "Comprovante de registro no conselho (CRP/CRM)",
  "Diploma de graduação",
  "Certificado de especialização",
  "Comprovante de endereço",
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
  const salvarRepasse = useServerFn(salvarDadosRepasse);
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
    profissao: "psicologo",
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
    formacao: "",
    especializacoes: "",
    areas: "",
    idiomas: "",
  });
  const [repasse, setRepasse] = useState({
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
        profissao: p.profissao ?? "psicologo",
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
        formacao: (p.formacao ?? []).join(", "),
        especializacoes: (p.especializacoes ?? []).join(", "),
        areas: (p.areas ?? []).join(", "),
        idiomas: (p.idiomas ?? []).join(", "),
      });
    } else if (dados.data?.email) {
      setForm((f) => ({ ...f, email_contato: dados.data!.email! }));
    }
    const r = dados.data?.repasse;
    if (r) {
      setRepasse({
        documento: r.documento ?? "",
        chave_pix: r.chave_pix ?? "",
        banco: r.banco ?? "",
        agencia: r.agencia ?? "",
        conta: r.conta ?? "",
        tipo_conta: r.tipo_conta ?? "corrente",
      });
    }
  }, [dados.data]);

  async function enviarCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    try {
      const r = await salvar({
        data: {
          ...form,
          profissao: form.profissao === "psiquiatra" ? "psiquiatra" : "psicologo",
          experiencia_anos: Number(form.experiencia_anos) || 0,
          slot_minutos: Number(form.slot_minutos) || 50,
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

  async function enviarRepasse(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const r = await salvarRepasse({ data: repasse });
    if (!r.ok) setErro(r.erro);
    else setAviso("Dados de repasse salvos.");
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
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Área do profissional</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Meu cadastro</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Estas informações formam o seu perfil público. Os documentos são usados apenas para
        verificação e ficam visíveis somente para você e para a equipe da plataforma.
      </p>

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
        <div>
          <label htmlFor="profissao" className="section-label">
            Profissão
          </label>
          <select
            id="profissao"
            className="field-base mt-2"
            value={form.profissao}
            onChange={(e) => setForm({ ...form, profissao: e.target.value })}
          >
            <option value="psicologo">Psicólogo(a)</option>
            <option value="psiquiatra">Psiquiatra</option>
          </select>
        </div>
        <Campo
          label="Registro profissional (CRP ou CRM)"
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
            <option value="Terapia Cognitivo-Comportamental" />
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
          label="Formação (separe por vírgula)"
          value={form.formacao}
          onChange={(v) => setForm({ ...form, formacao: v })}
          className="sm:col-span-2"
        />
        <Campo
          label="Especializações (separe por vírgula)"
          value={form.especializacoes}
          onChange={(v) => setForm({ ...form, especializacoes: v })}
          className="sm:col-span-2"
        />
        <Campo
          label="Áreas de atuação (separe por vírgula)"
          value={form.areas}
          onChange={(v) => setForm({ ...form, areas: v })}
          className="sm:col-span-2"
        />
        <Campo
          label="Idiomas (separe por vírgula)"
          value={form.idiomas}
          onChange={(v) => setForm({ ...form, idiomas: v })}
          className="sm:col-span-2"
        />
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
          plataforma retém apenas a comissão combinada, de forma automática.
        </p>
        <div className="card-soft mt-5 p-7">
          {!vinculo.data?.configurado ? (
            <p className="text-sm text-muted-foreground">
              O recebimento ainda está sendo configurado pela plataforma. Enquanto isso, seus
              repasses são feitos pelos dados informados abaixo.
            </p>
          ) : vinculo.data.vinculado ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Conta ligada</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comissão da plataforma: {vinculo.data.comissaoPercent}% por consulta.
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
        <h2 className="text-2xl">Dados para receber seus repasses</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Usamos estes dados apenas para transferir a sua parte do valor das consultas.
        </p>

        <form onSubmit={enviarRepasse} className="card-soft mt-5 grid gap-5 p-7 sm:grid-cols-2">
          <Campo
            label="CPF ou CNPJ"
            value={repasse.documento}
            onChange={(v) => setRepasse({ ...repasse, documento: v })}
          />
          <Campo
            label="Chave Pix"
            value={repasse.chave_pix}
            onChange={(v) => setRepasse({ ...repasse, chave_pix: v })}
          />
          <Campo
            label="Banco"
            value={repasse.banco}
            onChange={(v) => setRepasse({ ...repasse, banco: v })}
          />
          <div>
            <label htmlFor="tipo-conta" className="section-label">
              Tipo de conta
            </label>
            <select
              id="tipo-conta"
              className="field-base mt-2"
              value={repasse.tipo_conta}
              onChange={(e) => setRepasse({ ...repasse, tipo_conta: e.target.value })}
            >
              <option value="corrente">Conta corrente</option>
              <option value="poupanca">Conta poupança</option>
              <option value="pagamento">Conta de pagamento</option>
            </select>
          </div>
          <Campo
            label="Agência"
            value={repasse.agencia}
            onChange={(v) => setRepasse({ ...repasse, agencia: v })}
          />
          <Campo
            label="Conta (com dígito)"
            value={repasse.conta}
            onChange={(v) => setRepasse({ ...repasse, conta: v })}
          />
          <button type="submit" className="btn-base btn-primary sm:col-span-2">
            Salvar dados de repasse
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
