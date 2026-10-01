import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { areaDoCaminho, destinoDaArea, INICIO_DA_AREA, ROTULO_DA_AREA, type Area } from "@/lib/areas";
import { guardarPerfilPretendido, minhaArea } from "@/lib/role-access";
import { useServerFn } from "@tanstack/react-start";
import { autorizarTentativaLogin, registrarEventoAutenticacao } from "@/lib/auth.functions";

type Modo = "entrar" | "cadastro" | "recuperar" | "nova-senha";
type MfaPendente = { factorId: string; qrCode?: string; secret?: string };

type BuscaAuth = {
  redirect?: string | undefined;
  modo: Modo;
  perfil?: "profissional" | "gestor" | undefined;
};

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): BuscaAuth => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
    modo: ["cadastro", "recuperar", "nova-senha"].includes(String(search["modo"]))
      ? (search["modo"] as Modo)
      : "entrar",
    ...(["profissional", "gestor"].includes(String(search["perfil"]))
      ? { perfil: search["perfil"] as "profissional" | "gestor" }
      : {}),
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — TOC Brazil" },
      {
        name: "description",
        content:
          "Acesse sua conta TOC Brazil para agendar consultas online com psicólogos com experiência em TOC."
      },
      { property: "og:title", content: "Entrar ou criar conta — TOC Brazil" },
      {
        property: "og:description",
        content: "Crie sua conta para agendar consultas online com profissionais com experiência em TOC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>(search.modo);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [conflito, setConflito] = useState<{ area: Area; email: string | null } | null>(null);
  const [mfa, setMfa] = useState<MfaPendente | null>(null);
  const [codigoMfa, setCodigoMfa] = useState("");
  const autorizarLogin = useServerFn(autorizarTentativaLogin);
  const registrarAuth = useServerFn(registrarEventoAutenticacao);

  const profissional = search.perfil === "profissional";
  const gestor = search.perfil === "gestor";
  // Área que esta página representa: vem do botão clicado ("Sou paciente" / "Sou profissional" / gestor)
  // ou da página protegida que pediu login.
  const areaPretendida: Area = profissional
    ? "profissional"
    : gestor
      ? "gestor"
      : (areaDoCaminho(search.redirect) ?? "paciente");
  const acessoGestor = areaPretendida === "gestor";
  const inicioPretendido = INICIO_DA_AREA[areaPretendida];

  async function prepararMfaGestor() {
    const { data: niveis, error: erroNivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (erroNivel) throw erroNivel;
    if (niveis.currentLevel === "aal2") return true;

    const { data: fatores, error: erroFatores } = await supabase.auth.mfa.listFactors();
    if (erroFatores) throw erroFatores;
    const fatorVerificado = fatores.totp.find((fator) => fator.status === "verified");
    if (fatorVerificado) {
      setMfa({ factorId: fatorVerificado.id });
      return false;
    }

    const { data: inscricao, error: erroInscricao } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      // O provedor mantém nomes de inscrições interrompidas por algum tempo.
      // Um sufixo único evita que esse histórico impeça a criação do novo QR.
      friendlyName: `Gestão TOC Brazil ${Date.now()}`,
    });
    if (erroInscricao) throw erroInscricao;
    const qrCode = inscricao.totp.qr_code?.trim();
    const secret = inscricao.totp.secret?.trim();
    if (!qrCode && !secret) throw new Error("Não foi possível gerar o código de configuração.");
    setMfa({
      factorId: inscricao.id,
      qrCode,
      secret,
    });
    return false;
  }

  async function verificarMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfa || codigoMfa.trim().length !== 6) return;
    setErro(null);
    setCarregando(true);
    try {
      const { data: desafio, error: erroDesafio } = await supabase.auth.mfa.challenge({ factorId: mfa.factorId });
      if (erroDesafio) throw erroDesafio;
      const { data: sessaoMfa, error: erroVerificacao } = await supabase.auth.mfa.verify({
        factorId: mfa.factorId,
        challengeId: desafio.id,
        code: codigoMfa.trim(),
      });
      if (erroVerificacao) throw erroVerificacao;
      const { error: erroSessao } = await supabase.auth.setSession({
        access_token: sessaoMfa.access_token,
        refresh_token: sessaoMfa.refresh_token,
      });
      if (erroSessao) throw erroSessao;
      const { data: niveis, error: erroNivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (erroNivel || niveis.currentLevel !== "aal2") {
        throw new Error("A segunda etapa ainda não foi confirmada.");
      }
      const area = await minhaArea();
      navigate({ to: destinoDaArea(area, search.redirect), replace: true });
    } catch {
      setErro("Código inválido ou expirado. Confira o aplicativo e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setModo(search.modo);
    setErro(null);
    setAviso(null);
  }, [search.modo]);

  useEffect(() => {
    let cancelado = false;

    // Com sessão ativa, descobre a área real da conta no servidor e só então encaminha.
    async function encaminhar(session: Session) {
      try {
        const area = await minhaArea(areaPretendida === "profissional" ? "profissional" : undefined);
        if (cancelado) return;
        if (area !== areaPretendida) {
          if (area === "gestor") {
            if (!(await prepararMfaGestor())) return;
            navigate({ to: destinoDaArea(area, search.redirect), replace: true });
            return;
          }
          setConflito({ area, email: session.user.email ?? null });
          return;
        }
        if (area === "gestor" && !(await prepararMfaGestor())) return;
        navigate({ to: destinoDaArea(area, search.redirect), replace: true });
      } catch {
        if (!cancelado) setErro("Não foi possível identificar sua área de acesso. Tente novamente.");
      }
    }

    // Link de redefinição de senha: o Supabase devolve o usuário logado com evento PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setModo("nova-senha");
        return;
      }
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (modo === "nova-senha" || window.location.hash.includes("type=recovery")) return;
        if (event === "SIGNED_IN") {
          const papel = areaPretendida === "gestor" ? "admin" : areaPretendida;
          void registrarAuth({ data: { evento: "login", papel } });
        }
        void encaminhar(session);
      }
    });
    return () => {
      cancelado = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaPretendida, search.redirect, navigate]);

  async function sairDaContaAtual() {
    setCarregando(true);
    try {
      if (conflito) {
        await registrarAuth({ data: { evento: "logout", papel: conflito.area === "gestor" ? "admin" : conflito.area } });
      }
      await supabase.auth.signOut();
      setConflito(null);
      setAviso(null);
    } finally {
      setCarregando(false);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setConfirmacaoPendente(false);
    setCarregando(true);
    try {
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth?modo=nova-senha${profissional ? "&perfil=profissional" : acessoGestor ? "&perfil=gestor" : ""}`,
        });
        if (error) throw error;
        setAviso("Se este e-mail tiver conta, você receberá um link para criar uma nova senha.");
        return;
      }
      if (senha.length < 10) {
        setErro("A senha precisa ter pelo menos 10 caracteres.");
        return;
      }
      if (modo === "nova-senha") {
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        setAviso("Senha atualizada. Entrando…");
        navigate({ to: inicioPretendido, replace: true });
        return;
      }
      if (modo === "cadastro") {
        if (nome.trim().length < 2) {
          setErro("Informe seu nome.");
          return;
        }
        // A intenção declarada aqui fixa a área da conta (paciente ou profissional) no primeiro acesso.
        const perfilConta = areaPretendida === "profissional" ? "profissional" : "paciente";
        guardarPerfilPretendido(perfilConta);
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: window.location.origin + inicioPretendido,
            data: { nome: nome.trim(), perfil: perfilConta },
          },
        });
        if (error) throw error;
        if (data.user?.identities?.length === 0) {
          setAviso("Este e-mail já tem conta. Entre com sua senha ou use “Esqueci minha senha”.");
          return;
        }
        if (!data.session) {
          setAviso("Enviamos um e-mail de confirmação. Confirme para acessar sua conta.");
          setConfirmacaoPendente(true);
          return;
        }
      } else {
        const limite = await autorizarLogin({ data: { email: email.trim() } });
        if (!limite.ok) {
          setErro(limite.erro);
          return;
        }
        const { data: login, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        if (!login.session) throw new Error("Não foi possível iniciar a sessão.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível continuar.";
      setErro(
        msg.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered")
            ? "Este e-mail já tem conta. Escolha “Entrar”."
            : msg,
      );
    } finally {
      setCarregando(false);
    }
  }

  async function reenviarConfirmacao() {
    setErro(null);
    setAviso(null);
    setCarregando(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + inicioPretendido },
      });
      if (error) throw error;
      setAviso("E-mail de confirmação reenviado. Verifique também a caixa de spam.");
    } catch {
      setErro("Não foi possível reenviar agora. Aguarde alguns minutos e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    setErro(null);
    guardarPerfilPretendido(areaPretendida);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErro("Não foi possível entrar com o Google agora.");
      return;
    }
  }

  if (conflito) {
    const rotuloAtual = ROTULO_DA_AREA[conflito.area];
    const rotuloPagina = ROTULO_DA_AREA[areaPretendida];
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="card-soft mx-auto max-w-lg p-7 sm:p-8" role="status">
          <span className="section-label">Conta conectada</span>
          <h1 className="heading-page mt-3">Você já está conectado como {rotuloAtual}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {conflito.email ? <>A conta <strong className="text-foreground">{conflito.email}</strong> pertence à área do {rotuloAtual}. </> : null}
            Esta página é o acesso do {rotuloPagina}. Cada conta pertence a uma única área; para usar a plataforma como{" "}
            {rotuloPagina}, saia e entre (ou crie uma conta) com outro e-mail.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to={INICIO_DA_AREA[conflito.area]} className="btn-base btn-primary">
              Ir para a minha área
            </Link>
            <button type="button" onClick={sairDaContaAtual} disabled={carregando} className="btn-base btn-ghost disabled:opacity-60">
              Sair desta conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (acessoGestor && mfa) {
    return (
      <div className="container-page py-14 lg:py-20">
        <div className="card-soft mx-auto max-w-lg p-7 sm:p-8">
          <span className="section-label">Proteção da gestão</span>
          <h1 className="heading-page mt-3">Autenticação em duas etapas</h1>
          {mfa.qrCode ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">Leia o código com seu aplicativo autenticador e informe o código de seis dígitos.</p>
              <img src={mfa.qrCode} alt="Código QR para configurar o aplicativo autenticador" className="mx-auto mt-6 size-56" />
              {mfa.secret && <p className="mt-3 break-all text-center text-xs text-muted-foreground">Chave manual: {mfa.secret}</p>}
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Informe o código de seis dígitos do seu aplicativo autenticador.</p>
          )}
          <form onSubmit={verificarMfa} className="mt-6 space-y-4">
            <label className="block text-sm">Código de verificação
              <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={codigoMfa} onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, ""))} className="field-base mt-1" required />
            </label>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <button type="submit" disabled={carregando || codigoMfa.length !== 6} className="btn-base btn-primary w-full disabled:opacity-60">{carregando ? "Verificando…" : "Verificar e entrar"}</button>
          </form>
        </div>
      </div>
    );
  }

  const titulo =
    modo === "cadastro"
      ? profissional ? "Crie sua conta profissional" : "Crie sua conta"
       : modo === "recuperar"
        ? "Recuperar acesso"
        : modo === "nova-senha"
          ? "Defina uma nova senha"
           : profissional ? "Acesso do profissional" : acessoGestor ? "Acesso do gestor" : "Entrar na plataforma";

  return (
    <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_0.9fr] lg:py-20">
      <div className="max-w-lg">
        <span className="section-label">
           {profissional ? "Área do profissional" : acessoGestor ? "Área da gestão" : modo === "cadastro" ? "Criar conta de paciente" : "Acesso do paciente"}
        </span>
        <h1 className="heading-page mt-3">{titulo}</h1>
        <p className="mt-4 text-muted-foreground">
          {modo === "recuperar"
            ? "Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
            : modo === "nova-senha"
              ? "Escolha uma senha nova com pelo menos 10 caracteres."
               : profissional
                ? "Entre para acessar seu consultório digital: agenda, consultas, financeiro e cadastro."
                  : acessoGestor
                    ? "Entre com uma conta autorizada e autenticação em duas etapas para acessar a gestão da plataforma."
                : modo === "cadastro"
                  ? "Cadastre-se para ver os horários disponíveis, os valores e agendar com o profissional que escolher."
                  : "Entre para acessar suas consultas, lembretes e dados de cadastro."}
        </p>
         {!profissional && !acessoGestor && (
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="card-soft p-4">Agenda real dos profissionais, com confirmação imediata.</li>
            <li className="card-soft p-4">Histórico de consultas, lembretes e recibos em um só lugar.</li>
            <li className="card-soft p-4">Seus dados de cadastro e agendamento ficam protegidos por área de acesso.</li>
          </ul>
        )}
         {profissional && (
          <p className="mt-8 text-sm text-muted-foreground">
            Ainda não tem cadastro?{" "}
            <Link to="/cadastro-profissional" className="underline underline-offset-4">
              Veja como funciona
            </Link>
            .
          </p>
        )}
      </div>

      <div className="card-soft p-7 sm:p-8">
        {(modo === "entrar" || modo === "cadastro") && (
          <>
            <div className="flex gap-2 rounded-xl bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => navigate({ to: "/auth", search: { ...search, modo: "entrar" }, replace: true })}
                className={`flex-1 rounded-lg px-3 py-2 ${modo === "entrar" ? "bg-background font-semibold" : ""}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/auth", search: { ...search, modo: "cadastro" }, replace: true })}
                className={`flex-1 rounded-lg px-3 py-2 ${modo === "cadastro" ? "bg-background font-semibold" : ""}`}
              >
                Criar conta
              </button>
            </div>

            <button type="button" onClick={entrarComGoogle} className="btn-base btn-ghost mt-5 w-full">
              Continuar com o Google
            </button>

            <p className="mt-5 text-center text-xs uppercase tracking-widest text-muted-foreground">
              ou com e-mail
            </p>
          </>
        )}

        <form onSubmit={enviar} className="mt-5 space-y-4">
          {modo === "cadastro" && (
            <label className="block text-sm">
              Nome completo
              <input
                className="field-base mt-1"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={120}
                autoComplete="name"
                required
              />
            </label>
          )}
          {modo !== "nova-senha" && (
            <label className="block text-sm">
              E-mail
              <input
                type="email"
                className="field-base mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                autoComplete="email"
                required
              />
            </label>
          )}
          {modo !== "recuperar" && (
            <label className="block text-sm">
              {modo === "nova-senha" ? "Nova senha" : "Senha"}
              <input
                type="password"
                className="field-base mt-1"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={10}
                maxLength={72}
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                required
              />
            </label>
          )}

          {erro && <p className="text-sm text-destructive">{erro}</p>}
          {aviso && <p className="text-sm text-foreground">{aviso}</p>}
          {confirmacaoPendente && (
            <button
              type="button"
              onClick={reenviarConfirmacao}
              disabled={carregando}
              className="text-sm font-semibold text-primary underline underline-offset-4 disabled:opacity-60"
            >
              Reenviar e-mail de confirmação
            </button>
          )}

          <button type="submit" disabled={carregando} className="btn-base btn-primary w-full disabled:opacity-60">
            {carregando
              ? "Aguarde…"
              : modo === "cadastro"
                ? "Criar conta"
                : modo === "recuperar"
                  ? "Enviar link de recuperação"
                  : modo === "nova-senha"
                    ? "Salvar nova senha"
                    : "Entrar"}
          </button>
        </form>

        {modo === "entrar" && (
          <button
            type="button"
            className="mt-4 text-xs text-muted-foreground underline underline-offset-4"
            onClick={() => navigate({ to: "/auth", search: { ...search, modo: "recuperar" }, replace: true })}
          >
            Esqueci minha senha
          </button>
        )}
        {modo === "recuperar" && (
          <button
            type="button"
            className="mt-4 text-xs text-muted-foreground underline underline-offset-4"
            onClick={() => navigate({ to: "/auth", search: { ...search, modo: "entrar" }, replace: true })}
          >
            Voltar para entrar
          </button>
        )}

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Ao continuar, você concorda com os{" "}
          <Link to="/termos" className="underline underline-offset-4">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link to="/privacidade" className="underline underline-offset-4">
            Política de privacidade
          </Link>
          , incluindo o uso de dados necessários para cadastro, agendamento e pagamento conforme a LGPD.
        </p>
      </div>
    </div>
  );
}
