import { createFileRoute, Link } from "@tanstack/react-router";
import fotoPerfil from "@/assets/psicologa-perfil.jpg";

export const Route = createFileRoute("/para-psicologos")({
  head: () => ({
    meta: [
      { title: "Para psicólogos: atenda online com agenda e pagamentos | TOC Brazil" },
      {
        name: "description",
        content:
          "Crie seu perfil, configure disponibilidade e valores, receba agendamentos de pessoas que buscam acompanhamento em TOC e acompanhe seus repasses.",
      },
      { property: "og:title", content: "Para psicólogos: estrutura completa para atender online" },
      {
        property: "og:description",
        content:
          "Perfil verificado, agenda própria, checkout para o paciente e painel financeiro com repasses e comprovantes.",
      },
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
  "Áreas de atuação",
  "Documentos para validação",
  "Preço da sessão",
  "Disponibilidade",
  "Dados de recebimento",
  "Termos profissionais",
  "Aguardar aprovação",
];

function ParaPsicologos() {
  return (
    <>
      <section className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div className="rise-in">
          <span className="pill">Para profissionais</span>
          <h1 className="mt-6 text-3xl leading-tight sm:text-5xl">
            Você cuida do paciente. Nós cuidamos da infraestrutura.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            A TOC Brazil é especializada em TOC e conecta você a pessoas que já estão buscando
            acompanhamento. Perfil verificado, agenda própria, checkout para o paciente e painel
            financeiro com repasses e comprovantes.
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
          <h2 className="text-2xl sm:text-3xl">Como funciona o cadastro</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Seu perfil fica público apenas após a verificação dos requisitos definidos pela
            plataforma. Os status possíveis são: cadastro incompleto, em análise, aprovado,
            requer correção e suspenso.
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
        <h2 className="text-2xl sm:text-3xl">O que você administra no painel</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Agenda", d: "Dias, horários, recorrências, bloqueios, duração e intervalos." },
            { t: "Consultas", d: "Próximas sessões, histórico, status e reagendamentos." },
            { t: "Videochamada", d: "Atendimento no navegador, sem gravação por padrão." },
            { t: "Financeiro", d: "Saldo, valores pendentes, repasses, taxas e comprovantes." },
            { t: "Perfil", d: "Apresentação, abordagem, áreas de atuação e valores." },
            {
              t: "Segurança",
              d: "Preferências, autenticação em duas etapas e sessões ativas.",
            },
          ].map((i) => (
            <article key={i.t} className="card-soft card-soft-hover p-6">
              <h3 className="text-lg">{i.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          A TOC Brazil atua como infraestrutura tecnológica e cobra uma taxa pelo uso. O atendimento
          psicológico permanece sob responsabilidade do profissional habilitado, conforme as
          normas do CFP. Não prometemos volume de pacientes nem resultados.
        </p>
      </section>
    </>
  );
}
