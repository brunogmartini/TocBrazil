import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/cadastro-profissional")({
  head: () => ({
    meta: [
      { title: "Sou profissional — cadastro e acesso | TOC Brazil" },
      {
        name: "description",
        content:
          "Cadastre-se como psicólogo com experiência em TOC, ou entre na sua conta profissional. Conferência de CRP e documentos antes da publicação."
      },
      { property: "og:title", content: "Sou profissional — TOC Brazil" },
      {
        property: "og:description",
        content: "Cadastro com verificação de registro profissional e documentos antes da publicação do perfil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/cadastro-profissional" },
    ],
    links: [{ rel: "canonical", href: "/cadastro-profissional" }],
  }),
  component: CadastroProfissional,
});

const etapas = [
  { t: "Crie sua conta", d: "E-mail e senha ou Google. Leva menos de um minuto." },
  { t: "Preencha seu cadastro inicial", d: "Conte quem você é e apresente sua experiência profissional." },
  { t: "Complete a verificação", d: "Depois do cadastro inicial, envie os comprovantes necessários em sua área." },
  { t: "Conferência documental", d: "Conferimos inscrição ativa no CRP e documentos apresentados. Se algo precisar de correção, avisamos na sua área." },
  { t: "Configure sua agenda", d: "Defina sua disponibilidade recorrente e bloqueie exceções direto no calendário." },
  { t: "Perfil publicado", d: "Depois da aprovação, seu perfil fica visível e pronto para receber agendamentos." },
];

const statusFluxo = [
  { t: "1. Cadastro iniciado", d: "Conta criada, dados profissionais ainda não preenchidos." },
  { t: "2. Dados pessoais preenchidos", d: "Formação, áreas e apresentação salvos." },
  { t: "3. Documentação/títulos enviados", d: "Arquivos recebidos e aguardando a análise." },
  { t: "4. Documentação em análise", d: "Nossa equipe está verificando registro e documentos." },
  { t: "5. Necessita correção/complementação", d: "Algum item precisa ser reenviado ou ajustado." },
  { t: "6. Cadastro aprovado", d: "Tudo validado. Falta apenas definir a agenda." },
  { t: "7. Perfil publicado/ativo", d: "Perfil visível na vitrine e recebendo agendamentos." },
];

const beneficios = [
  {
    t: "Sem custos recorrentes",
    d: "Sem comissão, sem percentual, sem mensalidade.",
  },
  {
    t: "Pagamento garantido",
    d: "O valor é reservado no cartão do paciente 36 horas antes da consulta e cobrado depois dela. Você não corre risco de atendimento sem pagamento.",
  },
  {
    t: "Recebimento direto",
    d: "O dinheiro vai direto para a sua conta de recebimento, sem passar pela TOC Brazil.",
  },
  {
    t: "Sua forma de atender",
    d: "Você atende na sua própria sala de videochamada, com sua abordagem e seus registros.",
  },
  {
    t: "Liberdade profissional",
    d: "Sem exclusividade e sem meta. Você atende quando e quanto quiser.",
  },
];

function CadastroProfissional() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    track("professional_signup", { etapa: "pagina_cadastro" });
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) throw error;
      navigate({ to: "/profissional" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setErro(msg.includes("Invalid login credentials") ? "E-mail ou senha incorretos." : "Não foi possível entrar agora.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <section aria-labelledby="beneficios-profissional" className="border-y border-border bg-surface py-8 sm:px-8">
        <span className="section-label">Por que fazer parte?</span>
        <h2 id="beneficios-profissional" className="heading-section mt-2">
          Autonomia para cuidar do seu trabalho
        </h2>
        <article className="mt-7 max-w-3xl border border-border bg-background px-5 py-6 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-0">
            {["Sem mensalidade", "Sem exclusividade", "Sem meta"].map((item, index) => (
              <p
                key={item}
                className={`flex min-h-7 items-center gap-3 text-lg font-semibold text-foreground ${index > 0 ? "border-t border-border pt-5 sm:border-l sm:border-t-0 sm:px-6 sm:pt-0" : "sm:pr-6"}`}
              >
                <span aria-hidden="true" className="shrink-0 text-primary">✓</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </article>
        <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {beneficios.map((beneficio) => (
            <article key={beneficio.t} className="border-l-2 border-primary pl-4">
              <h3 className="heading-card">{beneficio.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{beneficio.d}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 max-w-3xl border-t border-border pt-6">
          <p className="text-lg font-semibold leading-relaxed">Taxa fixa de R$ 27 por consulta realizada, igual para todos os profissionais, qualquer que seja o valor que você cobra.</p>
          <div className="mt-5">
            <h3 className="heading-card">Por que existe uma taxa?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A taxa custeia a estrutura que você usa. Plataforma, agenda, processamento de pagamentos, custos contábeis, verificação de registro e proteção de dados. É o que mantém a TOC Brazil funcionando e ao alcance de quem procura ajuda.</p>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="card-soft p-8">
          <span className="section-label">Profissional novo</span>
          <h2 className="heading-section mt-2">Comece com seus dados essenciais</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Primeiro, crie sua conta. Depois você completa o perfil e envia os comprovantes para conferência em um ambiente privado.</p>
          <ol className="mt-6 space-y-4">
            {etapas.map((e, i) => (
              <li key={e.t} className="flex gap-4">
                <span className="step-index">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold">{e.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ modo: "cadastro" as const, redirect: "/profissional/cadastro", perfil: "profissional" as const }}
              className="btn-base btn-primary"
            >
              Criar conta e começar
            </Link>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Ao continuar, você declara ser profissional habilitado e concorda com os{" "}
            <Link to="/termos" className="underline underline-offset-4">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="underline underline-offset-4">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <aside className="professional-login card-soft self-start p-8 lg:sticky lg:top-24">
          <span className="professional-label">Profissional cadastrado</span>
          <h2 className="heading-section mt-2">Já sou profissional cadastrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para acessar seu consultório digital: agenda, consultas, financeiro e cadastro.
          </p>
          <form onSubmit={entrar} className="mt-6 space-y-4">
            <label className="block text-sm">
              E-mail
              <input
                type="email"
                className="field-base mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm">
              Senha
              <input
                type="password"
                className="field-base mt-1"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <button type="submit" disabled={carregando} className="btn-base btn-primary w-full disabled:opacity-60">
              {carregando ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs">
            <Link
              to="/auth"
              search={{ modo: "recuperar" as const, redirect: "/profissional", perfil: "profissional" as const }}
              className="text-muted-foreground underline underline-offset-4"
            >
              Esqueci minha senha
            </Link>
            <Link
              to="/auth"
              search={{ modo: "entrar" as const, redirect: "/profissional", perfil: "profissional" as const }}
              className="text-muted-foreground underline underline-offset-4"
            >
              Entrar com o Google
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-14">
        <h2 className="heading-section">Etapas do seu cadastro</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Você acompanha em que etapa está dentro da sua área. A equipe confere os documentos
          e o perfil só fica público depois que todos os requisitos forem aprovados.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusFluxo.map((s) => (
            <li key={s.t} className="card-soft p-5">
              <p className="text-sm font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          A conferência do CRP e dos documentos é obrigatória antes da publicação. A plataforma não
          interfere na conduta profissional e não promete volume de pacientes.
        </p>
      </section>
    </div>
  );
}
