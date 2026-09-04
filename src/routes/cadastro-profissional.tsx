import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/cadastro-profissional")({
  head: () => ({
    meta: [
      { title: "Cadastro profissional — psicólogos e psiquiatras | TOC Brazil" },
      {
        name: "description",
        content:
          "Envie seus dados e documentos para verificação e publique seu perfil na TOC Brazil, plataforma especializada em TOC com agenda e pagamentos integrados.",
      },
      { property: "og:title", content: "Cadastro profissional na TOC Brazil" },
      {
        property: "og:description",
        content:
          "Cadastro com verificação de registro profissional e documentos antes da publicação do perfil.",
      },
      { property: "og:url", content: "/cadastro-profissional" },
    ],
    links: [{ rel: "canonical", href: "/cadastro-profissional" }],
  }),
  component: CadastroProfissional,
});

const status = [
  { t: "Cadastro incompleto", d: "Faltam informações ou documentos para iniciar a análise." },
  { t: "Em análise", d: "Recebemos tudo e estamos verificando os documentos enviados." },
  { t: "Aprovado", d: "Perfil publicado e disponível para agendamentos." },
  { t: "Requer correção", d: "Algum documento precisa ser reenviado ou corrigido." },
  { t: "Suspenso", d: "Perfil temporariamente indisponível por pendência ou solicitação." },
];

const etapas = [
  { t: "1. Crie sua conta", d: "E-mail e senha ou Google. Leva menos de um minuto." },
  {
    t: "2. Preencha seu cadastro",
    d: "Registro profissional, formação, áreas de atuação e experiência com TOC.",
  },
  {
    t: "3. Envie seus documentos",
    d: "Documento de identidade, comprovante de registro no conselho e diplomas.",
  },
  {
    t: "4. Configure sua agenda",
    d: "Você define os dias, os horários e a duração das consultas. Bloqueios a qualquer momento.",
  },
  {
    t: "5. Perfil publicado",
    d: "Depois da verificação, seu perfil fica visível e pronto para receber agendamentos.",
  },
];

function CadastroProfissional() {
  useEffect(() => {
    track("professional_signup", { etapa: "pagina_cadastro" });
  }, []);

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Para profissionais</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Cadastro profissional</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        O cadastro acontece dentro da sua conta. Depois de entrar, você completa seus dados, envia
        os documentos para verificação e configura sua agenda.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-soft p-8">
          <h2 className="text-2xl">Como funciona o cadastro</h2>
          <ol className="mt-6 space-y-4">
            {etapas.map((e, i) => (
              <li key={e.t} className="flex gap-4">
                <span className="step-index">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold">{e.t.replace(/^\d+\.\s/, "")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ modo: "cadastro" as const, redirect: "/profissional/cadastro" }}
              className="btn-base btn-primary"
            >
              Criar conta e começar
            </Link>
            <Link
              to="/auth"
              search={{ modo: "entrar" as const, redirect: "/profissional" }}
              className="btn-base btn-ghost"
            >
              Já tenho conta
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
        </div>

        <aside>
          <h2 className="text-xl">Status possíveis do seu perfil</h2>
          <ul className="mt-5 space-y-3">
            {status.map((s) => (
              <li key={s.t} className="card-soft p-5">
                <p className="text-sm font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            A verificação de registro e documentos é obrigatória antes da publicação. A plataforma
            não interfere na conduta clínica e não promete volume de pacientes.
          </p>
        </aside>
      </div>
    </div>
  );
}

