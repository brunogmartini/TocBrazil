import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança: como protegemos seus dados | TOC Brazil" },
      {
        name: "description",
        content:
          "Autenticação, acesso por papel, criptografia em trânsito, links externos de videochamada, auditoria e conferência de registro.",
      },
      { property: "og:title", content: "Segurança na TOC Brazil" },
      {
        property: "og:description",
        content:
          "Práticas de segurança para dados pessoais, agendamentos e pagamentos.",
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
  { t: "Videochamada", d: "A TOC Brazil não hospeda a videochamada e não acessa seu conteúdo." },
  { t: "Auditoria", d: "Registro de ações sensíveis para rastreabilidade." },
  { t: "Verificação", d: "Inscrição no CRP e documentos de formação apresentados são conferidos antes da publicação do perfil." },
  { t: "Pagamentos", d: "Dados de cartão processados por provedor especializado, nunca armazenados por nós." },
  { t: "Minimização", d: "Coletamos o mínimo de dados necessário para operar o serviço." },
];

function Seguranca() {
  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Confiança</span>
      <h1 className="heading-page mt-3">Como protegemos seus dados</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        A plataforma trata dados pessoais de cadastro, agenda e pagamento com controles de acesso por papel.
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
          A TOC Brazil não avalia pacientes, não realiza diagnósticos, não prescreve condutas e não faz promessa de desfecho. Também não somos um serviço de urgência: em caso de crise, ligue 188 (CVV) ou 192 (SAMU).
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
