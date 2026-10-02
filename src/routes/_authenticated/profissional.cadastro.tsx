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
} from "@/lib/profissional.functions";
import { statusRecebimentoAsaas } from "@/lib/asaas.functions";
import { EtapasCadastro, ProfessionalNav } from "@/components/professional-nav";
import { ContractAcceptance } from "@/components/contract-acceptance";
import { exigirAreaProfissional } from "@/lib/role-access";
import { moeda } from "@/lib/video-sala";
import { TAXA_FIXA_CENTAVOS, valorProfissionalCentavos } from "@/lib/precos";
import { cpfValido, cnpjValido, formatarCpf, formatarCnpj } from "@/lib/documento-pessoa";
import {
  ABORDAGENS_PERFIL,
  IDIOMAS_PERFIL,
  TEMAS_TOC_PERFIL,
  type FormacaoPublica,
} from "@/lib/perfil-profissional";


export const Route = createFileRoute("/_authenticated/profissional/cadastro")({
  beforeLoad: () => exigirAreaProfissional(),
  head: () => ({
    meta: [
      { title: "Meu cadastro profissional — TOC Brazil" },
      {
        name: "description",
        content: "Complete seus dados, envie documentos para verificação e configure o recebimento direto.",
      },
      { property: "og:title", content: "Meu cadastro profissional — TOC Brazil" },
      {
        property: "og:description",
        content: "Dados profissionais, documentos e recebimento direto na TOC Brazil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CadastroProfissional,
});

const rotuloDoc: Record<string, string> = {
  enviado: "Em análise",
  aprovado: "Aprovado",
  recusado: "Requer reenvio",
};

function CadastroProfissional() {
  const queryClient = useQueryClient();
  const carregar = useServerFn(meuCadastroProfissional);
  const salvar = useServerFn(salvarCadastroProfissional);
  const registrar = useServerFn(registrarDocumento);
  const remover = useServerFn(removerDocumento);
  const statusVinculo = useServerFn(statusRecebimentoAsaas);

  const dados = useQuery({ queryKey: ["cadastro-profissional"], queryFn: () => carregar() });
  const vinculo = useQuery({
    queryKey: ["vinculo-asaas"],
    queryFn: () => statusVinculo(),
  });


  const [form, setForm] = useState({
    nome: "",
    tipo_pessoa: "PF" as "PF" | "PJ",
    cpf: "",
    telefone: "",
    cnpj: "",
    registro: "",
    uf: "",
    genero: "",
    abordagens_publicas: [] as string[],
    formacoes_publicas: [{ instituicao: "", curso: "Psicologia", ano: new Date().getFullYear() }] as FormacaoPublica[],
    temas_toc_publicos: [] as string[],
    biografia_publica: "",
    foto_caminho: "",
    experiencia_anos: "0",
    slot_minutos: "50",
    valor_consulta: "200",
    areas: "",
    idiomas: [] as string[],
    certidao_validade: "",
    ferramenta_provedor: "",
    ferramenta_url_sala: "",
    ferramenta_instrucoes: "",
  });
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [campoErro, setCampoErro] = useState<string | null>(null);
  const [enviandoDoc, setEnviandoDoc] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [cadastroFinalizado, setCadastroFinalizado] = useState(false);
  const [mfaProfissional, setMfaProfissional] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [codigoMfa, setCodigoMfa] = useState("");

  async function prepararMfaProfissional() {
    setErro(null);
    const { data: fatores, error: erroFatores } = await supabase.auth.mfa.listFactors();
    if (erroFatores) return setErro("Não foi possível consultar a proteção em duas etapas.");
    if (fatores.totp.some((fator) => fator.status === "verified")) {
      setAviso("A autenticação em duas etapas já está ativa nesta conta.");
      return;
    }
    const { data: inscricao, error: erroInscricao } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Profissional TOC Brazil" });
    if (erroInscricao) return setErro("Não foi possível iniciar a configuração agora.");
    setMfaProfissional({ id: inscricao.id, qr: inscricao.totp.qr_code, secret: inscricao.totp.secret });
  }

  async function confirmarMfaProfissional() {
    if (!mfaProfissional || codigoMfa.length !== 6) return;
    const { data: desafio, error: erroDesafio } = await supabase.auth.mfa.challenge({ factorId: mfaProfissional.id });
    if (erroDesafio) return setErro("Não foi possível validar o código agora.");
    const { error: erroVerificacao } = await supabase.auth.mfa.verify({ factorId: mfaProfissional.id, challengeId: desafio.id, code: codigoMfa });
    if (erroVerificacao) return setErro("Código inválido ou expirado.");
    setMfaProfissional(null);
    setCodigoMfa("");
    setAviso("Autenticação em duas etapas ativada.");
  }

  useEffect(() => {
    const p = dados.data?.profissional;
    if (p) {
      setForm({
        nome: p.nome ?? "",
        tipo_pessoa: p.tipo_pessoa === "PJ" ? "PJ" : "PF",
        cpf: p.cpf ?? "",
        telefone: p.telefone ?? "",
        cnpj: p.cnpj ?? "",
        registro: p.registro ?? "",
        uf: p.uf ?? "",
        genero: p.genero ?? "",
        abordagens_publicas: p.abordagens_publicas ?? [],
        formacoes_publicas: (p.formacoes_publicas as unknown as FormacaoPublica[])?.length
          ? (p.formacoes_publicas as unknown as FormacaoPublica[])
          : [{ instituicao: "", curso: "Psicologia", ano: new Date().getFullYear() }],
        temas_toc_publicos: p.temas_toc_publicos ?? [],
        biografia_publica: p.biografia_publica ?? "",
        foto_caminho: p.foto_caminho ?? "",
        experiencia_anos: String(p.experiencia_anos ?? 0),
        slot_minutos: String(p.slot_minutos ?? 50),
        valor_consulta: String((p.valor_centavos ?? 20000) / 100),
        areas: (p.areas ?? []).join(", "),
        idiomas: p.idiomas ?? [],
        certidao_validade: p.certidao_validade ?? "",
        ferramenta_provedor: p.ferramenta_provedor ?? "",
        ferramenta_url_sala: p.ferramenta_url_sala ?? "",
        ferramenta_instrucoes: p.ferramenta_instrucoes ?? "",
      });
    }
  }, [dados.data]);

  async function enviarCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCampoErro(null);
    setAviso(null);
    try {
      const apontar = (campo: string, mensagem: string) => {
        setCampoErro(campo);
        setErro(mensagem);
        document.getElementById(campo)?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(campo)?.focus();
      };
      if (!cpfValido(form.cpf)) return apontar("cpf", "Informe um CPF válido.");
      if (form.tipo_pessoa === "PJ" && !cnpjValido(form.cnpj)) return apontar("cnpj", "Informe um CNPJ válido.");
      if (!/^\d{10,11}$/.test(form.telefone.replace(/\D/g, ""))) return apontar("telefone", "Informe um telefone válido com DDD.");
      const { valor_consulta, ...restoForm } = form;
      const valorConsultaCentavos = Math.round((Number(valor_consulta) || 0) * 100);
      if (valorConsultaCentavos <= TAXA_FIXA_CENTAVOS) {
        return apontar("valor-da-consulta", "O valor da consulta precisa ser maior que R$ 27,00.");
      }
      const r = await salvar({
        data: {
          ...restoForm,
          profissao: "psicologo",
          experiencia_anos: Number(form.experiencia_anos) || 0,
          slot_minutos: Number(form.slot_minutos) || 50,
          valor_centavos: valorConsultaCentavos,
        },
      });
      if (!r.ok) {
        setErro(r.erro);
        const campo = r.erro.includes("CNPJ") ? "cnpj" : r.erro.includes("CPF") ? "cpf" : r.erro.includes("telefone") ? "telefone" : r.erro.includes("CRP") ? "registro" : r.erro.includes("UF") ? "uf" : null;
        if (campo) {
          setCampoErro(campo);
          document.getElementById(campo)?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById(campo)?.focus();
        } else document.getElementById("erro-cadastro")?.scrollIntoView({ behavior: "smooth", block: "center" });
        console.error("Falha no cadastro profissional", { mensagem: r.erro });
        return;
      }
      setAviso("Dados salvos. Agora envie o comprovante do CRP e os demais documentos para a análise. Você receberá uma atualização por e-mail.");
      setCadastroFinalizado(true);
      await queryClient.invalidateQueries();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar agora.");
      console.error("Falha no cadastro profissional", err);
      document.getElementById("erro-cadastro")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function enviarArquivo(file: File, tipo: string) {
    setErro(null);
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return setErro("Envie um PDF, JPG ou PNG.");
    if (file.size > 5 * 1024 * 1024) return setErro("O documento deve ter no máximo 5 MB.");
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
        data: { tipo, nome_arquivo: file.name, caminho },
      });
      if (!r.ok) throw new Error(r.erro);
      setAviso(tipo === "Carteirinha profissional do CRP" ? "Comprovante do CRP recebido para análise." : "Documento enviado para análise.");
      await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
      console.error("Falha no envio de documento profissional", err);
      document.getElementById("erro-cadastro")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setEnviandoDoc(false);
    }
  }

  async function enviarFoto(file: File) {
    setErro(null);
    if (!file.type.startsWith("image/")) return setErro("Envie uma imagem JPG, PNG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return setErro("A foto deve ter no máximo 5 MB.");
    const dimensoes = await new Promise<{ largura: number; altura: number }>((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => resolve({ largura: imagem.naturalWidth, altura: imagem.naturalHeight });
      imagem.onerror = reject;
      imagem.src = URL.createObjectURL(file);
    }).catch(() => null);
    if (!dimensoes || dimensoes.largura < 600 || dimensoes.altura < 600 || dimensoes.largura !== dimensoes.altura) {
      return setErro("A foto precisa ser quadrada e ter pelo menos 600 × 600 pixels.");
    }
    setEnviandoFoto(true);
    try {
      const { data: sessao } = await supabase.auth.getUser();
      const uid = sessao.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const extensao = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const caminho = `${uid}/perfil-${Date.now()}.${extensao}`;
      const { error: uploadErro } = await supabase.storage.from("fotos-profissionais").upload(caminho, file);
      if (uploadErro) throw new Error("Não foi possível enviar a foto.");
      setForm((atual) => ({ ...atual, foto_caminho: caminho }));
      setAviso("Foto enviada. Salve o cadastro para encaminhá-la à conferência manual.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  const temCadastro = Boolean(dados.data?.profissional);
  const documentos = dados.data?.documentos ?? [];
  const status = dados.data?.profissional?.status;

  function DocumentoCampo({ tipo, titulo, descricao }: { tipo: string; titulo: string; descricao?: string }) {
    const enviados = documentos.filter((documento) => documento.tipo === tipo);
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <label className="section-label">
          {titulo}
          <input
            type="file"
             accept="application/pdf,image/jpeg,image/png"
            className="field-base mt-2"
            disabled={enviandoDoc}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void enviarArquivo(arquivo, tipo);
              e.target.value = "";
            }}
          />
        </label>
        {descricao && <p className="mt-2 text-xs text-muted-foreground">{descricao}</p>}
        {enviados.map((documento) => (
          <div key={documento.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>{documento.nome_arquivo} · {rotuloDoc[documento.status] ?? documento.status}</span>
            <button type="button" className="underline underline-offset-4" onClick={async () => { await remover({ data: { id: documento.id } }); await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] }); }}>Remover</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="professional-workspace py-12 lg:py-16">
    <div className="container-page">
      <div className="professional-heading p-6 sm:p-8">
        <span className="professional-label">Consultório digital</span>
        <h1 className="mt-3 text-3xl sm:text-4xl">
          {temCadastro ? "Seu cadastro profissional" : "Comece seu cadastro"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {temCadastro
            ? "Seus dados essenciais foram recebidos. Complete abaixo as informações e os comprovantes necessários para a conferência."
            : "Comece com seus dados essenciais. Depois de salvar, você poderá completar o perfil e enviar os comprovantes em uma área privada."}
        </p>
      </div>
      <ProfessionalNav ativo="/profissional/cadastro" />
      {dados.data?.etapa && <div className="card-soft mt-6 p-5"><EtapasCadastro etapaAtual={dados.data.etapa} /><p className="mt-4 text-sm text-muted-foreground">{dados.data.etapa.descricao}</p></div>}

      {dados.data?.profissional && (
        <div className="card-soft mt-6 p-5">
          <p className="section-label">Situação do seu cadastro</p>
          <p className="mt-2 text-sm font-semibold">
             {dados.data.profissional.status === "aprovado"
               ? "Cadastro aprovado. Seu perfil está publicado na página pública de profissionais."
              : dados.data.profissional.status === "rejeitado"
                ? "Cadastro rejeitado. Veja a observação da equipe, ajuste os dados e salve novamente."
                : dados.data.profissional.status === "suspenso"
                  ? "Perfil suspenso temporariamente. Fale com a equipe da plataforma."
                   : documentos.some((documento) => documento.tipo === "Carteirinha profissional do CRP")
                     ? "Recebemos seu cadastro e o comprovante do CRP. Ele está em análise; avisaremos por e-mail. Seu perfil ainda não aparece na busca."
                     : "Dados iniciais recebidos. Envie o comprovante do CRP abaixo para continuar a conferência. Seu perfil ainda não aparece na busca."}
          </p>
           {dados.data.profissional.status === "aprovado" && <p className="mt-2 text-sm text-muted-foreground">Cadastro aprovado e contrato vigente aceito.</p>}
          {dados.data.profissional.observacao_admin && (
            <p className="mt-2 text-sm text-muted-foreground">
              Observação da equipe: {dados.data.profissional.observacao_admin}
            </p>
          )}
        </div>
      )}

      {aviso && <p className="mt-6 text-sm font-semibold">{aviso}</p>}
        {erro && <p id="erro-cadastro" role="alert" className="mt-6 text-sm font-semibold text-destructive">{erro}</p>}


      {cadastroFinalizado && !temCadastro ? null : <form onSubmit={enviarCadastro} className="card-soft mt-8 grid gap-5 p-7 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="professional-label">Etapa {temCadastro ? "2" : "1"}</span>
          <h2 className="heading-section mt-2">{temCadastro ? "Complete seu perfil e a verificação" : "Dados essenciais"}</h2>
        </div>
        <p className="sm:col-span-2 rounded-lg bg-muted p-4 text-sm font-semibold">
          Não inclua telefone, e-mail, redes sociais ou links. O contato acontece pela plataforma.
        </p>
        <Campo
          label="Nome completo"
          value={form.nome}
          onChange={(v) => setForm({ ...form, nome: v })}
          className="sm:col-span-2"
          required
        />
        <fieldset className="sm:col-span-2">
          <legend className="section-label">Tipo de cadastro</legend>
          <div className="mt-2 flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="tipo-pessoa" checked={form.tipo_pessoa === "PF"} onChange={() => setForm({ ...form, tipo_pessoa: "PF", cnpj: "" })} /> Pessoa física</label>
            <label className="flex items-center gap-2"><input type="radio" name="tipo-pessoa" checked={form.tipo_pessoa === "PJ"} onChange={() => setForm({ ...form, tipo_pessoa: "PJ" })} /> Pessoa jurídica</label>
          </div>
        </fieldset>
        <Campo
          label="CPF"
          id="cpf"
          inputMode="numeric"
          invalid={campoErro === "cpf"}
          value={formatarCpf(form.cpf)}
          onChange={(v) => setForm({ ...form, cpf: v.replace(/\D/g, "").slice(0, 11) })}
          required
        />
        <Campo label="Telefone com DDD (uso administrativo, não publicado)" id="telefone" inputMode="tel" invalid={campoErro === "telefone"} value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v.replace(/\D/g, "").slice(0, 11) })} required />
        {temCadastro && <div className="sm:col-span-2"><DocumentoCampo tipo="Documento de identidade" titulo="Documento de identidade com foto" /></div>}
        {form.tipo_pessoa === "PJ" && <Campo
          label="CNPJ"
          id="cnpj"
          inputMode="numeric"
          invalid={campoErro === "cnpj"}
          value={formatarCnpj(form.cnpj)}
          onChange={(v) => setForm({ ...form, cnpj: v.replace(/\D/g, "").slice(0, 14) })}
          required
        />}
        <Campo
          label="Registro profissional (CRP)"
          id="registro"
          invalid={campoErro === "registro"}
          value={form.registro}
          onChange={(v) => setForm({ ...form, registro: v })}
          required
        />
        <Campo
          label="UF do registro"
          id="uf"
          invalid={campoErro === "uf"}
          value={form.uf}
          onChange={(v) => setForm({ ...form, uf: v.toUpperCase().slice(0, 2) })}
          required
        />
        {temCadastro && <div className="sm:col-span-2"><DocumentoCampo tipo="Carteirinha profissional do CRP" titulo="Comprovante do CRP (obrigatório)" descricao="Envie a carteirinha ou a certidão de situação ativa em PDF, JPG ou PNG (até 5 MB). Você pode substituir o arquivo antes da conferência." /></div>}

        {!temCadastro && (
          <>
            <Campo
              label="Anos de experiência"
              type="number"
              value={form.experiencia_anos}
              onChange={(v) => setForm({ ...form, experiencia_anos: v })}
            />
            <ValorConsultaCampo valor={form.valor_consulta} onChange={(valor_consulta) => setForm({ ...form, valor_consulta })} />
          </>
        )}
        {temCadastro && <>
        <div>
          <label htmlFor="foto-perfil" className="section-label">Foto do perfil</label>
          <input id="foto-perfil" type="file" accept="image/jpeg,image/png,image/webp" className="field-base mt-2" disabled={enviandoFoto} onChange={(e) => { const arquivo = e.target.files?.[0]; if (arquivo) void enviarFoto(arquivo); e.target.value = ""; }} />
          <p className="mt-1 text-xs text-muted-foreground">Rosto visível, recente, quadrada e com no mínimo 600 × 600 pixels. A publicação depende de conferência manual.</p>
          {dados.data?.profissional?.foto_status && <p className="mt-2 text-xs font-semibold">Situação: {dados.data.profissional.foto_status === "aprovada" ? "aprovada" : dados.data.profissional.foto_status === "recusada" ? "requer nova foto" : dados.data.profissional.foto_status === "pendente" ? "em análise" : "não enviada"}</p>}
        </div>
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
        <ValorConsultaCampo valor={form.valor_consulta} onChange={(valor_consulta) => setForm({ ...form, valor_consulta })} />
        <fieldset className="sm:col-span-2 rounded-lg border border-border p-4">
          <legend className="section-label px-1">Abordagens teóricas — escolha até 3</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{ABORDAGENS_PERFIL.map((item) => <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.abordagens_publicas.includes(item)} disabled={!form.abordagens_publicas.includes(item) && form.abordagens_publicas.length >= 3} onChange={(e) => setForm({ ...form, abordagens_publicas: e.target.checked ? [...form.abordagens_publicas, item] : form.abordagens_publicas.filter((valor) => valor !== item) })} />{item}</label>)}</div>
        </fieldset>
        <fieldset className="sm:col-span-2 rounded-lg border border-border p-4">
          <legend className="section-label px-1">Formação declarada</legend>
          {form.formacoes_publicas.map((item, indice) => <div key={indice} className="mt-4 rounded-lg border border-border p-4"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]"><input aria-label={`Instituição ${indice + 1}`} className="field-base" placeholder="Instituição" value={item.instituicao} onChange={(e) => setForm({ ...form, formacoes_publicas: form.formacoes_publicas.map((f, i) => i === indice ? { ...f, instituicao: e.target.value } : f) })} /><input aria-label={`Curso ${indice + 1}`} className="field-base" placeholder="Curso" value={item.curso} onChange={(e) => setForm({ ...form, formacoes_publicas: form.formacoes_publicas.map((f, i) => i === indice ? { ...f, curso: e.target.value } : f) })} /><input aria-label={`Ano ${indice + 1}`} className="field-base" type="number" min="1900" max={new Date().getFullYear()} value={item.ano} onChange={(e) => setForm({ ...form, formacoes_publicas: form.formacoes_publicas.map((f, i) => i === indice ? { ...f, ano: Number(e.target.value) } : f) })} />{form.formacoes_publicas.length > 1 && <button type="button" className="btn-base btn-ghost" onClick={() => setForm({ ...form, formacoes_publicas: form.formacoes_publicas.filter((_, i) => i !== indice) })}>Remover</button>}</div><div className="mt-3"><DocumentoCampo tipo={indice === 0 ? "Diploma de graduação" : `Comprovante de formação ${indice + 1}`} titulo="Documento comprobatório" /></div></div>)}
          <button type="button" className="btn-base btn-ghost mt-3" onClick={() => setForm({ ...form, formacoes_publicas: [...form.formacoes_publicas, { instituicao: "", curso: "", ano: new Date().getFullYear() }] })}>Adicionar formação</button>
        </fieldset>
        <fieldset className="sm:col-span-2 rounded-lg border border-border p-4"><legend className="section-label px-1">Experiência com TOC</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{TEMAS_TOC_PERFIL.map((item) => <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.temas_toc_publicos.includes(item)} onChange={(e) => setForm({ ...form, temas_toc_publicos: e.target.checked ? [...form.temas_toc_publicos, item] : form.temas_toc_publicos.filter((valor) => valor !== item) })} />{item}</label>)}</div></fieldset>
        <div className="sm:col-span-2">
          <label htmlFor="idiomas" className="section-label">Idiomas</label>
          <div className="mt-2 flex flex-wrap gap-4">{IDIOMAS_PERFIL.map((item) => <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.idiomas.includes(item)} onChange={(e) => setForm({ ...form, idiomas: e.target.checked ? [...form.idiomas, item] : form.idiomas.filter((valor) => valor !== item) })} />{item}</label>)}</div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="biografia" className="section-label">
            Biografia
          </label>
          <textarea
            id="biografia"
            rows={5}
            className="field-base mt-2"
            maxLength={600}
            required
            value={form.biografia_publica}
            onChange={(e) => setForm({ ...form, biografia_publica: e.target.value })}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{form.biografia_publica.length}/600</p>
        </div>
        <Campo
          label="Validade da certidão do CRP"
          type="date"
          value={form.certidao_validade}
          onChange={(v) => setForm({ ...form, certidao_validade: v })}
        />
        <div><DocumentoCampo tipo="Certidão de regularidade do CRP" titulo="Certidão de regularidade do CRP" /></div>
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
        </>}
        <button type="submit" className="btn-base btn-primary sm:col-span-2">
          {temCadastro ? "Salvar atualizações" : "Salvar dados e continuar"}
        </button>
      </form>}

      {temCadastro && (
        <section className="mt-12" aria-labelledby="contrato-profissional-titulo">
          <h2 id="contrato-profissional-titulo" className="text-2xl">Contrato profissional</h2>
          <ContractAcceptance />
        </section>
      )}

      <section className="mt-12" aria-labelledby="seguranca-conta">
        <h2 id="seguranca-conta" className="text-2xl">Segurança da conta</h2>
        <div className="card-soft mt-5 p-7">
          <p className="max-w-2xl text-sm text-muted-foreground">Você pode proteger seu acesso com um aplicativo autenticador.</p>
          {!mfaProfissional ? (
            <button type="button" className="btn-base btn-ghost mt-4" onClick={prepararMfaProfissional}>Configurar autenticação em duas etapas</button>
          ) : (
            <div className="mt-5 max-w-md space-y-4">
              <img src={mfaProfissional.qr} alt="Código QR para configurar o aplicativo autenticador" className="size-52" />
              <p className="break-all text-xs text-muted-foreground">Chave manual: {mfaProfissional.secret}</p>
              <label className="block text-sm">Código de seis dígitos
                <input className="field-base mt-2" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={codigoMfa} onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, ""))} />
              </label>
              <button type="button" className="btn-base btn-primary" disabled={codigoMfa.length !== 6} onClick={confirmarMfaProfissional}>Ativar proteção</button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Receber direto pela sua conta Asaas</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          A plataforma cria sua subconta de recebimento no Asaas após a conferência cadastral. O split
          separa automaticamente a taxa fixa da plataforma do valor que vai para você.
        </p>
        <div className="card-soft mt-5 p-7">
          {vinculo.data?.ativo ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Conta ligada</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conta preparada para split: taxa fixa em reais por consulta realizada.
                </p>
              </div>
               <span className="pill">Ambiente de teste ativo</span>
            </div>
          ) : (
            <p className="max-w-xl text-sm text-muted-foreground">{vinculo.data?.temCadastro ? "Sua subconta Asaas será criada pela equipe depois da conferência dos dados necessários para recebimento." : "Salve seus dados profissionais acima para iniciar a preparação do recebimento."}</p>
          )}
        </div>
      </section>


      <div className="mt-12 flex flex-wrap gap-3">
        {vinculo.data?.ativo && <Link to="/profissional/agenda" className="btn-base btn-primary">Configurar minha agenda</Link>}
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
  id,
  inputMode,
  invalid,
  value,
  onChange,
  type = "text",
  className = "",
  required = false,
}: {
  label: string;
  id?: string;
  inputMode?: "numeric" | "tel";
  invalid?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  const campoId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className={className}>
      <label htmlFor={campoId} className="section-label">
        {label}
      </label>
      <input
        id={campoId}
        inputMode={inputMode}
        aria-invalid={invalid}
        type={type}
        required={required}
        className={`field-base mt-2 ${invalid ? "border-destructive ring-1 ring-destructive" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ValorConsultaCampo({ valor, onChange }: { valor: string; onChange: (valor: string) => void }) {
  const valorCentavos = Math.round((Number(valor) || 0) * 100);
  const invalido = valor !== "" && valorCentavos <= TAXA_FIXA_CENTAVOS;
  return (
    <div>
      <label htmlFor="valor-da-consulta" className="section-label">Valor da sua consulta</label>
      <input
        id="valor-da-consulta"
        type="number"
        inputMode="decimal"
        min="27.01"
        step="0.01"
        required
        className="field-base mt-2"
        value={valor}
        onChange={(e) => {
          e.target.setCustomValidity("");
          onChange(e.target.value);
        }}
        onInvalid={(e) => e.currentTarget.setCustomValidity("O valor da consulta precisa ser maior que R$ 27,00.")}
        aria-describedby="valor-consulta-apoio valor-consulta-recebimento valor-consulta-erro"
        aria-invalid={invalido}
      />
      <p id="valor-consulta-apoio" className="mt-2 text-xs text-muted-foreground">
        Este é o valor que o paciente vê e paga. Você define livremente.
      </p>
      <p id="valor-consulta-recebimento" className="mt-1 text-xs text-muted-foreground">
        Você recebe {moeda(valorProfissionalCentavos(valorCentavos))} por consulta realizada. A taxa fixa de R$ 27 é sua obrigação com a TOC Brazil e não é somada ao preço que o paciente paga.
      </p>
      {invalido && <p id="valor-consulta-erro" className="mt-1 text-xs font-semibold text-destructive">O valor da consulta precisa ser maior que R$ 27,00.</p>}
    </div>
  );
}
