import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança: como protegemos seus dados | TOC Brazil" },
      {
        name: "description",
        content:
          "Autenticação, acesso por papel, criptografia em trânsito, videochamada sem gravação, logs de auditoria e verificação de profissionais.",
      },
      { property: "og:title", content: "Segurança na TOC Brazil" },
      {
        property: "og:description",
        content:
          "Práticas de segurança pensadas para dados sensíveis de saúde e para o cuidado das pessoas.",
      },
      { property: "og:url", content: "/seguranca" },
    ],
    links: [{ rel: "canonical", href: "/seguranca" }],
  }),
  component: Seguranca,
});

const praticas = [
  { t: "Autenticação", d: "Login protegido e autenticação em duas etapas para contas profissionais." },
  { t: "Acesso por papel", d: "Paciente, profissional e administração acessam apenas o necessário." },
  { t: "Criptografia em trânsito", d: "Todo o tráfego entre você e a plataforma é cifrado." },
  { t: "Videochamada", d: "Consultas no navegador, sem gravação por padrão." },
  { t: "Auditoria", d: "Registro de ações sensíveis para rastreabilidade." },
  { t: "Verificação", d: "Documentação e registro profissional conferidos antes da publicação do perfil." },
  { t: "Pagamentos", d: "Dados de cartão processados por provedor especializado, nunca armazenados por nós." },
  { t: "Minimização", d: "Coletamos o mínimo de dados necessário para operar o serviço." },
];

function Seguranca() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Confiança</span>
      <h1 className="heading-page mt-3">Como protegemos seus dados</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Tratar informações de saúde mental exige cuidado redobrado. Estas são as práticas que
        orientam a construção da plataforma.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {praticas.map((p) => (
          <article key={p.t} className="card-soft p-6">
            <h2 className="heading-subsection">{p.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
          </article>
        ))}
      </div>

      <div className="card-soft mt-10 max-w-3xl p-6">
        <h2 className="heading-subsection">Limites da plataforma</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A TOC Brazil não realiza diagnósticos, não prescreve medicamentos e não promete resultados.
          Também não somos um serviço de emergência: em situação de risco imediato, procure
          atendimento de urgência na sua região.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link to="/privacidade" className="btn-base btn-ghost">
          Privacidade e LGPD
        </Link>
        <Link to="/suporte" className="btn-base btn-ghost">
          Falar com o suporte
        </Link>
      </div>
    </div>
  );
}
