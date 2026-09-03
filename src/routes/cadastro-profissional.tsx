import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/cadastro-profissional")({
  head: () => ({
    meta: [
      { title: "Cadastro profissional — psicólogos e psiquiatras | Clarea" },
      {
        name: "description",
        content:
          "Envie seus dados e documentos para verificação e publique seu perfil na Clarea, plataforma especializada em TOC com agenda e pagamentos integrados.",
      },
      { property: "og:title", content: "Cadastro profissional na Clarea" },
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

function CadastroProfissional() {
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Para profissionais</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Cadastro profissional</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Preencha os dados iniciais. Depois da criação da conta, você conclui o envio de
        documentos, define valores e configura sua agenda.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {enviado ? (
          <div className="card-soft p-8">
            <h2 className="text-2xl">Recebemos seu interesse</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nesta versão o cadastro ainda não está conectado ao banco de dados, então nenhum
              dado foi armazenado. Quando a área profissional estiver ativa, você continuará o
              processo pelo painel: envio de documentos, verificação, valores e disponibilidade.
            </p>
            <Link to="/profissionais" className="btn-base btn-ghost mt-8">
              Ver como aparece um perfil
            </Link>
          </div>
        ) : (
          <form
            className="card-soft grid gap-5 p-7 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              track("professional_signup", { etapa: "interesse" });
              setEnviado(true);
            }}
          >
            <Campo id="nome" label="Nome completo" className="sm:col-span-2" />
            <Campo id="email" label="E-mail profissional" type="email" />
            <Campo id="telefone" label="Telefone" type="tel" />
            <div>
              <label htmlFor="profissao" className="section-label">
                Profissão
              </label>
              <select id="profissao" required className="field-base mt-2">
                <option value="psicologo">Psicólogo(a)</option>
                <option value="psiquiatra">Psiquiatra</option>
              </select>
            </div>
            <Campo id="registro" label="Registro profissional (CRP ou CRM)" />
            <Campo id="uf" label="UF de registro" />
            <Campo id="areas" label="Principais áreas de atuação" />
            <div className="sm:col-span-2">
              <label htmlFor="apresentacao" className="section-label">
                Breve apresentação
              </label>
              <textarea id="apresentacao" rows={4} className="field-base mt-2" />
            </div>
            <label className="flex items-start gap-3 text-sm text-muted-foreground sm:col-span-2">
              <input type="checkbox" required className="mt-1" />
              <span>
                Declaro que sou profissional habilitado, que as informações são verdadeiras e que
                li os{" "}
                <Link to="/termos" className="underline underline-offset-4">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" className="underline underline-offset-4">
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
            <button type="submit" className="btn-base btn-primary sm:col-span-2">
              Enviar cadastro
            </button>
          </form>
        )}

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

function Campo({
  id,
  label,
  type = "text",
  className = "",
}: {
  id: string;
  label: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="section-label">
        {label}
      </label>
      <input id={id} name={id} type={type} required className="field-base mt-2" />
    </div>
  );
}
