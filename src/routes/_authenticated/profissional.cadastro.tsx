import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  meuCadastroProfissional,
  contratoAtualProfissional,
  assinarContratoProfissional,
  registrarDocumento,
  removerDocumento,
  salvarCadastroProfissional,
} from "@/lib/profissional.functions";
import {
  desvincularMercadoPago,
  iniciarVinculoMercadoPago,
  statusVinculoMercadoPago,
} from "@/lib/mercadopago.functions";
import { ProfessionalNav } from "@/components/professional-nav";
import { exigirAreaProfissional } from "@/lib/role-access";
import { moeda } from "@/lib/video-sala";
import { TAXA_FIXA_CENTAVOS } from "@/lib/precos";
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
  const statusVinculo = useServerFn(statusVinculoMercadoPago);
  const iniciarVinculo = useServerFn(iniciarVinculoMercadoPago);
  const desvincular = useServerFn(desvincularMercadoPago);
  const carregarContrato = useServerFn(contratoAtualProfissional);
  const assinarContrato = useServerFn(assinarContratoProfissional);

  const dados = useQuery({ queryKey: ["cadastro-profissional"], queryFn: () => carregar() });
  const vinculo = useQuery({
    queryKey: ["vinculo-mercadopago"],
    queryFn: () => statusVinculo(),
  });
  const contrato = useQuery({ queryKey: ["contrato-profissional"], queryFn: () => carregarContrato() });


  const [form, setForm] = useState({
    nome: "",
    cpf: "",
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
    valor_liquido: "200",
    areas: "",
    idiomas: [] as string[],
    certidao_validade: "",
    apolice_validade: "",
    seguradora_nome: "",
    apolice_numero: "",
    ferramenta_provedor: "",
    ferramenta_url_sala: "",
    ferramenta_instrucoes: "",
  });
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoDoc, setEnviandoDoc] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [cadastroFinalizado, setCadastroFinalizado] = useState(false);
  const [confirmouContrato, setConfirmouContrato] = useState(false);

  useEffect(() => {
    const p = dados.data?.profissional;
    if (p) {
      setForm({
        nome: p.nome ?? "",
        cpf: p.cpf ?? "",
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
        valor_liquido: String(Math.round((p.valor_liquido_centavos ?? Math.max((p.valor_centavos ?? 22700) - TAXA_FIXA_CENTAVOS, 0)) / 100)),
        areas: (p.areas ?? []).join(", "),
        idiomas: p.idiomas ?? [],
        certidao_validade: p.certidao_validade ?? "",
        apolice_validade: p.apolice_validade ?? "",
        seguradora_nome: p.seguradora_nome ?? "",
        apolice_numero: p.apolice_numero ?? "",
        ferramenta_provedor: p.ferramenta_provedor ?? "",
        ferramenta_url_sala: p.ferramenta_url_sala ?? "",
        ferramenta_instrucoes: p.ferramenta_instrucoes ?? "",
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
      const { valor_liquido, ...restoForm } = form;
      const r = await salvar({
        data: {
          ...restoForm,
          profissao: "psicologo",
          experiencia_anos: Number(form.experiencia_anos) || 0,
          slot_minutos: Number(form.slot_minutos) || 50,
          valor_liquido_centavos: Math.round((Number(valor_liquido) || 0) * 100),
        },
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setAviso("Recebemos seu cadastro. Ele está aguardando a validação da equipe e o perfil ainda não aparece publicamente.");
      setCadastroFinalizado(true);
      await queryClient.invalidateQueries();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar agora.");
    }
  }

  async function enviarArquivo(file: File, tipo: string) {
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
        data: { tipo, nome_arquivo: file.name, caminho },
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
            accept="application/pdf,image/*"
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
                  : "Recebemos seu cadastro. Ele está aguardando a validação da equipe e o perfil ainda não aparece publicamente."}
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
      {erro && <p className="mt-6 text-sm font-semibold text-destructive">{erro}</p>}


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
        <Campo
          label="CPF"
          value={form.cpf}
          onChange={(v) => setForm({ ...form, cpf: v.replace(/\D/g, "").slice(0, 11) })}
          required
        />
        {temCadastro && <div className="sm:col-span-2"><DocumentoCampo tipo="Documento de identidade" titulo="Documento de identidade com foto" /></div>}
        <Campo
          label="CNPJ"
          value={form.cnpj}
          onChange={(v) => setForm({ ...form, cnpj: v.replace(/\D/g, "").slice(0, 14) })}
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
        {temCadastro && <div className="sm:col-span-2"><DocumentoCampo tipo="Carteirinha profissional do CRP" titulo="Carteirinha profissional do CRP" descricao="Envie uma imagem ou PDF legível para conferência do registro." /></div>}

        {!temCadastro && (
          <>
            <Campo
              label="Anos de experiência"
              type="number"
              value={form.experiencia_anos}
              onChange={(v) => setForm({ ...form, experiencia_anos: v })}
            />
            <div>
              <Campo label="Quanto você quer receber por consulta? Informe o valor líquido desejado" type="number" value={form.valor_liquido} onChange={(v) => setForm({ ...form, valor_liquido: v })} required />
              <p className="mt-2 text-xs text-muted-foreground">O valor divulgado ao paciente será {moeda(Math.round((Number(form.valor_liquido) || 0) * 100) + TAXA_FIXA_CENTAVOS)}.</p>
            </div>
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
        <div>
          <Campo
            label="Quanto você quer receber por consulta? Informe o valor líquido desejado"
            type="number"
            value={form.valor_liquido}
            onChange={(v) => setForm({ ...form, valor_liquido: v })}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Valor que será divulgado ao paciente: <strong>{moeda(Math.round((Number(form.valor_liquido) || 0) * 100) + TAXA_FIXA_CENTAVOS)}</strong>.
          </p>
        </div>
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
        <fieldset className="sm:col-span-2 rounded-lg border border-border p-4">
          <legend className="section-label px-1">Seguro de responsabilidade civil (opcional)</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-3">
            <Campo label="Seguradora" value={form.seguradora_nome} onChange={(v) => setForm({ ...form, seguradora_nome: v })} />
            <Campo label="Número da apólice" value={form.apolice_numero} onChange={(v) => setForm({ ...form, apolice_numero: v })} />
            <Campo label="Validade da apólice" type="date" value={form.apolice_validade} onChange={(v) => setForm({ ...form, apolice_validade: v })} />
          </div>
          <div className="mt-4"><DocumentoCampo tipo="Apólice de seguro de responsabilidade civil profissional" titulo="Anexar apólice" /></div>
        </fieldset>
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
          {temCadastro ? "Salvar atualizações" : "Finalizar cadastro inicial"}
        </button>
      </form>}

      {temCadastro && (
        <section className="mt-12" aria-labelledby="contrato-profissional-titulo">
          <h2 id="contrato-profissional-titulo" className="text-2xl">Contrato profissional</h2>
          {!contrato.data?.disponivel && (
            <div className="card-soft mt-5 p-7">
              <p className="font-semibold">
                {contrato.data?.motivo === "cadastro_em_analise" ? "Seu cadastro ainda está em conferência." : "O contrato definitivo ainda não está disponível."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Quando a conferência terminar e o PDF for ativado, ele aparecerá aqui para leitura e assinatura.</p>
            </div>
          )}
          {contrato.data?.disponivel && contrato.data.aceite && (
            <div className="card-soft mt-5 p-7">
              <p className="font-semibold">Contrato {contrato.data.versao.versao} assinado eletronicamente.</p>
              <p className="mt-2 text-sm text-muted-foreground">Aceite registrado em {new Date(contrato.data.aceite.aceito_em).toLocaleString("pt-BR")}.</p>
              {contrato.data.versao.url && <a className="btn-base btn-ghost mt-4" href={contrato.data.versao.url} target="_blank" rel="noreferrer">Abrir contrato aceito</a>}
            </div>
          )}
          {contrato.data?.disponivel && !contrato.data.aceite && (
            <div className="card-soft mt-5 p-7">
              <h3 className="text-lg">{contrato.data.versao.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Versão {contrato.data.versao.versao}</p>
              {contrato.data.versao.url ? (
                <a className="btn-base btn-ghost mt-4" href={contrato.data.versao.url} target="_blank" rel="noreferrer">Ler o contrato em PDF</a>
              ) : <p className="mt-3 text-sm text-destructive">O arquivo não pôde ser aberto. Tente novamente mais tarde.</p>}
              {contrato.data.versao.modo_assinatura === "provedor" ? (
                <p className="mt-5 text-sm text-muted-foreground">A assinatura será concluída pelo provedor {contrato.data.versao.provedor}.</p>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={async (event) => {
                  event.preventDefault();
                  setErro(null);
                  const contratoDisponivel = contrato.data;
                  if (!contratoDisponivel?.disponivel) return;
                  const resultado = await assinarContrato({ data: {
                    nome_assinatura: contratoDisponivel.identidade.nome,
                    documento: contratoDisponivel.identidade.cpf,
                    versao_id: contratoDisponivel.versao.id,
                    confirmou: confirmouContrato,
                  } });
                  if (!resultado.ok) return setErro(resultado.erro);
                  setAviso("Aceite eletrônico registrado com sucesso.");
                  setConfirmouContrato(false);
                  await queryClient.invalidateQueries({ queryKey: ["contrato-profissional"] });
                }}>
                  <dl className="grid gap-3 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted-foreground">Nome</dt><dd className="font-semibold">{contrato.data.identidade.nome}</dd></div>
                    <div><dt className="text-muted-foreground">CRP</dt><dd className="font-semibold">{contrato.data.identidade.crp} · {contrato.data.identidade.uf}</dd></div>
                  </dl>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{contrato.data.textoAceite}</p>
                  <label className="flex items-start gap-3 text-sm">
                    <input className="mt-1" type="checkbox" checked={confirmouContrato} onChange={(event) => setConfirmouContrato(event.target.checked)} />
                    <span>Li o contrato em PDF e aceito integralmente seus termos. Confirmo que os dados acima me identificam.</span>
                  </label>
                  <button type="submit" disabled={!confirmouContrato || !contrato.data.versao.url} className="btn-base btn-primary disabled:opacity-50">Aceitar e assinar eletronicamente</button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl">Receber direto na sua conta Mercado Pago</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Ao ligar sua conta Mercado Pago, o valor de cada consulta cai direto na sua conta e a
          plataforma retém apenas a taxa fixa combinada, de forma automática.
        </p>
        <div className="card-soft mt-5 p-7">
          {!vinculo.data?.configurado ? (
            <p className="text-sm text-muted-foreground">
              O recebimento direto ainda está sendo configurado. Assim que estiver disponível, você poderá ligar sua conta Mercado Pago aqui.
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
