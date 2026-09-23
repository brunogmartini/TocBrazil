import { createFileRoute, Link } from "@tanstack/react-router";
import fotoPerfil from "@/assets/psicologa-perfil.jpg";

export const Route = createFileRoute("/para-psicologos")({
  head: () => ({
    meta: [
      { title: "Para psicólogos: atenda online com agenda e pagamentos | TOC Brazil" },
      {
        name: "description",
        content:
          "Crie seu perfil, configure disponibilidade e valores, informe sua sala de videochamada e receba pagamentos pela sua conta no provedor."
      },
      { property: "og:title", content: "Para psicólogos: estrutura completa para atender online" },
      {
        property: "og:description",
        content:
          "CRP conferido, agenda própria, checkout para o paciente e extrato de taxa fixa por consulta realizada."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/para-psicologos" },
    ],
    links: [{ rel: "canonical", href: "/para-psicologos" }],
  }),
  component: ParaPsicologos,
});

const etapas = [
  "Criar conta",
  "Dados pessoais",
  "CRP",
  "Formação",
  "Abordagem",
  "Experiência em TOC",
  "Documentos para validação",
  "Preço da consulta",
  "Disponibilidade",
  "Dados de recebimento",
  "Aguardar aprovação",
];

function ParaPsicologos() {
  return (
    <>
      <section className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div className="rise-in">
          <span className="pill">Para profissionais</span>
          <h1 className="heading-page mt-6">
            Organize sua agenda e receba consultas online.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            A TOC Brazil é uma plataforma de tecnologia para busca, agendamento e pagamento. Você mantém sua própria sala de videochamada, define seu valor e contrata diretamente com o paciente.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/cadastro-profissional" className="btn-base btn-primary">
              Criar meu cadastro profissional
            </Link>
            <Link to="/profissionais" className="btn-base btn-ghost">
              Ver como aparece o perfil
            </Link>
          </div>
        </div>
        <img
          src={fotoPerfil}
          alt="Psicóloga em seu consultório em casa, em frente ao computador"
          loading="lazy"
          width={1200}
          height={912}
          className="w-full rounded-[2rem] object-cover shadow-[var(--shadow-soft)]"
        />
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 className="heading-section">Como funciona o cadastro</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Seu perfil fica público apenas após conferirmos registro e documentos. Os status possíveis são: cadastro incompleto, em análise, publicado, requer correção e suspenso.
          </p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {etapas.map((e, i) => (
              <li key={e} className="card-soft flex items-center gap-4 p-4">
                <span className="font-display text-lg text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm">{e}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-14 lg:py-20">
        <h2 className="heading-section">O que você administra no painel</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Agenda", d: "Dias, horários, recorrências, bloqueios, duração e intervalos." },
            { t: "Consultas", d: "Próximas consultas, histórico, status e reagendamentos." },
            { t: "Sua videochamada", d: "Informe a URL da sala contratada e mantida por você." },
            { t: "Financeiro", d: "Extrato de consultas realizadas e taxa fixa por consulta." },
            { t: "Perfil", d: "Apresentação, abordagem, experiência em TOC, idiomas e valores." },
            {
              t: "Segurança",
              d: "Preferências, autenticação em duas etapas e sessões ativas.",
            },
          ].map((i) => (
            <article key={i.t} className="card-soft card-soft-hover p-6">
              <h3 className="heading-subsection">{i.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          A TOC Brazil atua como infraestrutura tecnológica e cobra uma taxa fixa em reais por consulta realizada, igual para todos os profissionais. A consulta permanece sob responsabilidade do psicólogo habilitado, conforme as normas do CFP.
        </p>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 className="heading-section">Dúvidas dos profissionais</h2>
          <dl className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="card-soft p-6">
              <dt className="heading-subsection">A TOC Brazil tem registro no CRP e responsável técnico?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Não, e não precisa ter. A TOC Brazil é uma empresa de tecnologia e não presta serviços psicológicos. Quem presta é você: contrata diretamente com o paciente, define seu valor e mantém seus próprios registros.
              </dd>
            </div>
            <div className="card-soft p-6">
              <dt className="heading-subsection">Quanto a plataforma cobra?</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Uma taxa fixa em reais por consulta realizada, igual para todos os profissionais, independentemente do valor que você cobra. Não é comissão nem percentual.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
