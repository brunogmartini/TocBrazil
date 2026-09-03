import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/para-psiquiatras")({
  head: () => ({
    meta: [
      { title: "Para psiquiatras: atenda online com agenda e pagamentos | TOC Brazil" },
      {
        name: "description",
        content:
          "Perfil verificado por CRM, agenda própria, checkout para o paciente, videochamada no navegador e painel financeiro com repasses.",
      },
      { property: "og:title", content: "Para psiquiatras: estrutura completa para atender online" },
      {
        property: "og:description",
        content:
          "Faça parte de uma rede especializada em TOC, com agenda, pagamentos e teleconsulta integrados.",
      },
      { property: "og:url", content: "/para-psiquiatras" },
    ],
    links: [{ rel: "canonical", href: "/para-psiquiatras" }],
  }),
  component: ParaPsiquiatras,
});

const etapas = [
  "Criar conta",
  "Dados pessoais",
  "CRM e UF de registro",
  "Formação e residência",
  "Áreas de atuação",
  "Documentos para validação",
  "Valor da consulta",
  "Disponibilidade",
  "Dados de recebimento",
  "Termos profissionais",
  "Aguardar aprovação",
];

const recursos = [
  { t: "Agenda", d: "Horários, duração, intervalos, bloqueios e prevenção de conflitos." },
  { t: "Consultas", d: "Próximas consultas, histórico, status e reagendamentos." },
  { t: "Teleconsulta", d: "Videochamada no navegador, sem gravação por padrão." },
  { t: "Financeiro", d: "Consultas realizadas, taxas da plataforma, repasses e comprovantes." },
  { t: "Perfil", d: "Apresentação, formação, áreas de atuação e valores." },
  { t: "Segurança", d: "Autenticação em duas etapas e acesso segmentado aos dados." },
];

function ParaPsiquiatras() {
  return (
    <>
      <section className="container-page py-14 lg:py-20">
        <span className="pill">Para médicos psiquiatras</span>
        <h1 className="mt-6 max-w-3xl text-3xl leading-tight sm:text-5xl">
          Atenda online com estrutura, sem montar operação própria.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A TOC Brazil é uma plataforma especializada em TOC. Cuidamos de agenda, pagamentos,
          teleconsulta e documentação, para que você foque na consulta.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/cadastro-profissional" className="btn-base btn-primary">
            Criar meu cadastro
          </Link>
          <Link to="/profissionais" className="btn-base btn-ghost">
            Ver como aparece o perfil
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-14 lg:py-20">
          <h2 className="text-2xl sm:text-3xl">Como funciona o cadastro</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Seu perfil fica público apenas após a verificação dos requisitos definidos pela
            plataforma. Status possíveis: cadastro incompleto, em análise, aprovado, requer
            correção e suspenso.
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
          {recursos.map((r) => (
            <article key={r.t} className="card-soft card-soft-hover p-6">
              <h3 className="text-lg">{r.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          A TOC Brazil atua como infraestrutura tecnológica e cobra uma taxa pelo uso. A consulta
          médica, incluindo avaliação, diagnóstico e prescrição, é de responsabilidade exclusiva
          do profissional habilitado, conforme as normas do CFM. A plataforma não interfere na
          conduta clínica.
        </p>
      </section>
    </>
  );
}
