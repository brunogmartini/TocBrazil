import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
    modo: search["modo"] === "cadastro" ? ("cadastro" as const) : ("entrar" as const),
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — TOC Brazil" },
      {
        name: "description",
        content:
          "Acesse sua conta TOC Brazil para agendar consultas online com psicólogos e psiquiatras com experiência em TOC.",
      },
      { property: "og:title", content: "Entrar ou criar conta — TOC Brazil" },
      {
        property: "og:description",
        content: "Crie sua conta para agendar consultas online com especialistas em TOC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function destinoSeguro(valor?: string) {
  if (!valor) return "/painel";
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : "/painel";
}

function Auth() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastro">(search.modo);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const destino = destinoSeguro(search.redirect);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destino, replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: destino, replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [destino, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "cadastro") {
        if (nome.trim().length < 2) {
          setErro("Informe seu nome.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: window.location.origin + "/painel",
            data: { nome: nome.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAviso("Enviamos um e-mail de confirmação. Confirme para acessar sua conta.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
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

  async function entrarComGoogle() {
    setErro(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErro("Não foi possível entrar com o Google agora.");
      return;
    }
  }

  return (
    <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_0.9fr] lg:py-20">
      <div className="max-w-lg">
        <span className="section-label">Sua conta</span>
        <h1 className="mt-3 text-3xl sm:text-4xl">
          {modo === "cadastro" ? "Crie sua conta" : "Entrar na plataforma"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Com a conta criada você vê os horários disponíveis, o valor da consulta e agenda com o
          profissional que escolher.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
          <li className="card-soft p-4">Agenda real dos profissionais, com confirmação imediata.</li>
          <li className="card-soft p-4">Histórico de consultas, lembretes e recibos em um só lugar.</li>
          <li className="card-soft p-4">Seus dados de saúde ficam visíveis apenas para você.</li>
        </ul>
      </div>

      <div className="card-soft p-7 sm:p-8">
        <div className="flex gap-2 rounded-xl bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setModo("entrar")}
            className={`flex-1 rounded-lg px-3 py-2 ${modo === "entrar" ? "bg-background font-semibold" : ""}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setModo("cadastro")}
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
          <label className="block text-sm">
            Senha
            <input
              type="password"
              className="field-base mt-1"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={8}
              maxLength={72}
              autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
              required
            />
          </label>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
          {aviso && <p className="text-sm text-foreground">{aviso}</p>}

          <button type="submit" disabled={carregando} className="btn-base btn-primary w-full disabled:opacity-60">
            {carregando ? "Aguarde…" : modo === "cadastro" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Ao continuar, você concorda com os{" "}
          <Link to="/termos" className="underline underline-offset-4">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link to="/privacidade" className="underline underline-offset-4">
            Política de privacidade
          </Link>
          , incluindo o tratamento de dados de saúde conforme a LGPD.
        </p>
      </div>
    </div>
  );
}
