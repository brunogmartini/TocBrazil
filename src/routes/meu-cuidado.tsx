import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/meu-cuidado")({
  head: () => ({
    meta: [
      { title: "Meu cuidado — suas consultas e seu acompanhamento | TOC Brazil" },
      {
        name: "description",
        content:
          "Área do paciente: próximas consultas, histórico, documentos, pagamentos e reagendamentos em um único lugar.",
      },
      { property: "og:title", content: "Meu cuidado na TOC Brazil" },
      {
        property: "og:description",
        content: "Acompanhe suas consultas, pagamentos e documentos com privacidade.",
      },
      { property: "og:url", content: "/meu-cuidado" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/meu-cuidado" }],
  }),
  component: MeuCuidado,
});

const recursos = [
  { t: "Próximas consultas", d: "Data, horário, profissional e link para entrar na videochamada." },
  { t: "Histórico", d: "Consultas realizadas, canceladas e reagendadas." },
  { t: "Pagamentos", d: "Comprovantes, status de cobrança e reembolsos quando aplicável." },
  { t: "Documentos", d: "Documentos fiscais emitidos pelas consultas." },
  { t: "Preferências", d: "Dados de contato, notificações e consentimentos LGPD." },
  { t: "Segurança", d: "Senha, autenticação em duas etapas e sessões ativas." },
];

function MeuCuidado() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Área do paciente</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Meu cuidado</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Aqui ficarão suas consultas, pagamentos e documentos. O acesso à conta ainda não está
        ativo nesta versão — a autenticação será habilitada na próxima etapa do projeto, junto do
        banco de dados e das regras de privacidade.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {recursos.map((r) => (
          <article key={r.t} className="card-soft p-6">
            <h2 className="text-lg">{r.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
          </article>
        ))}
      </div>

      <div className="card-soft mt-12 p-8">
        <h2 className="text-2xl">Enquanto isso</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Você já pode conhecer os profissionais disponíveis e ler os conteúdos educativos sobre
          TOC.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/profissionais" className="btn-base btn-primary">
            Encontrar um especialista em TOC
          </Link>
          <Link to="/conteudos" className="btn-base btn-ghost">
            Ver conteúdos
          </Link>
        </div>
      </div>
    </div>
  );
}
