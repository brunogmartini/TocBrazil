import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte e contato | TOC Brazil" },
      {
        name: "description",
        content:
          "Tire dúvidas sobre agendamento, pagamentos, cancelamentos, cadastro profissional e privacidade de dados na TOC Brazil.",
      },
      { property: "og:title", content: "Suporte da TOC Brazil" },
      {
        property: "og:description",
        content: "Canal de contato para dúvidas sobre consultas, pagamentos e privacidade.",
      },
      { property: "og:url", content: "/suporte" },
    ],
    links: [{ rel: "canonical", href: "/suporte" }],
  }),
  component: Suporte,
});

const temas = [
  { t: "Agendamento", d: "Dúvidas sobre horários, confirmação e reagendamento de consultas." },
  { t: "Pagamentos", d: "Cobranças, comprovantes, cancelamentos e reembolsos." },
  { t: "Cadastro profissional", d: "Documentos, verificação e status do perfil." },
  { t: "Privacidade", d: "Solicitações relacionadas aos seus dados pessoais e à LGPD." },
];

function Suporte() {
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="container-page py-12 lg:py-16">
      <span className="section-label">Confiança</span>
      <h1 className="mt-3 text-3xl sm:text-4xl">Suporte</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Nosso suporte trata de questões da plataforma. Questões clínicas devem ser conversadas
        diretamente com o profissional que atende você.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Em situação de risco imediato, não use este canal: procure atendimento de urgência na sua
        região.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        {enviado ? (
          <div className="card-soft p-8">
            <h2 className="text-2xl">Mensagem registrada</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nesta versão o envio de mensagens ainda não está conectado ao serviço de e-mail,
              então nenhum dado foi armazenado ou enviado. O canal de suporte será ativado junto
              das notificações transacionais.
            </p>
          </div>
        ) : (
          <form
            className="card-soft grid gap-5 p-7"
            onSubmit={(e) => {
              e.preventDefault();
              setEnviado(true);
            }}
          >
            <div>
              <label htmlFor="nome" className="section-label">
                Nome
              </label>
              <input id="nome" required className="field-base mt-2" />
            </div>
            <div>
              <label htmlFor="email" className="section-label">
                E-mail
              </label>
              <input id="email" type="email" required className="field-base mt-2" />
            </div>
            <div>
              <label htmlFor="tema" className="section-label">
                Tema
              </label>
              <select id="tema" className="field-base mt-2">
                {temas.map((t) => (
                  <option key={t.t} value={t.t}>
                    {t.t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mensagem" className="section-label">
                Mensagem
              </label>
              <textarea id="mensagem" rows={5} required className="field-base mt-2" />
            </div>
            <button type="submit" className="btn-base btn-primary">
              Enviar mensagem
            </button>
          </form>
        )}

        <aside>
          <h2 className="text-xl">Temas mais frequentes</h2>
          <ul className="mt-5 space-y-3">
            {temas.map((t) => (
              <li key={t.t} className="card-soft p-5">
                <p className="text-sm font-semibold">{t.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/privacidade" className="btn-base btn-ghost">
              Privacidade
            </Link>
            <Link to="/termos" className="btn-base btn-ghost">
              Termos
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
