import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import fotoPerfil from "@/assets/psicologa-perfil.jpg";
import { PSICOLOGOS_DEMO, formatarPreco } from "@/lib/psicologos-mock";

export const Route = createFileRoute("/psicologos/$slug")({
  loader: ({ params }) => {
    const psicologo = PSICOLOGOS_DEMO.find((p) => p.slug === params.slug);
    if (!psicologo) throw notFound();
    return { psicologo };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Perfil indisponível — Acolher" }, { name: "robots", content: "noindex" }],
      };
    }
    const { psicologo } = loaderData;
    const titulo = `${psicologo.nome} — psicólogo(a) online | Acolher`;
    const descricao = `${psicologo.abordagem}. Áreas de atuação: ${psicologo.areas.join(", ")}. Sessão online a partir de ${formatarPreco(psicologo.precoCentavos)}.`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
      ],
    };
  },
  component: Perfil,
});

const dias = ["Seg 08", "Ter 09", "Qua 10", "Qui 11", "Sex 12"];
const grade = ["08:00", "09:00", "11:00", "14:00", "16:00", "18:00"];

function Perfil() {
  const { psicologo } = Route.useLoaderData();

  return (
    <div className="container-page py-12 lg:py-16">
      <Link to="/psicologos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar para a busca
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={fotoPerfil}
              alt={`Foto profissional de ${psicologo.nome}`}
              loading="lazy"
              width={1200}
              height={912}
              className="h-28 w-28 shrink-0 rounded-3xl object-cover"
            />
            <div>
              <h1 className="text-3xl">{psicologo.nome}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {psicologo.crp} · {psicologo.uf} · {psicologo.experienciaAnos} anos de atuação
              </p>
              <p className="mt-2 text-sm">{psicologo.abordagem}</p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-xl">Apresentação</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {psicologo.apresentacao}
            </p>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <Bloco titulo="Áreas de atuação" itens={psicologo.areas} />
            <Bloco titulo="Público atendido" itens={psicologo.publicos} />
            <Bloco titulo="Idiomas" itens={psicologo.idiomas} />
            <Bloco titulo="Formação" itens={["Graduação em Psicologia", "Formações declaradas pelo profissional e verificadas pela plataforma"]} />
          </section>

          <section className="mt-10">
            <h2 className="text-xl">Como funciona o atendimento</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Sessões de 50 minutos por videochamada, no navegador. O horário é confirmado
              após a aprovação do pagamento e o link de acesso fica disponível em “Minhas
              consultas”.
            </p>
            <h3 className="mt-6 text-base">Política de cancelamento</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cancelamentos e reagendamentos solicitados com pelo menos 24 horas de
              antecedência seguem as regras de reembolso configuradas pela plataforma. Toda
              alteração é registrada.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft p-6">
            <p className="text-2xl font-semibold">{formatarPreco(psicologo.precoCentavos)}</p>
            <p className="text-sm text-muted-foreground">por sessão de 50 minutos</p>

            <h2 className="mt-8 text-base">Disponibilidade</h2>
            <div className="mt-4 grid grid-cols-5 gap-2 text-center">
              {dias.map((d) => (
                <span key={d} className="eyebrow">
                  {d}
                </span>
              ))}
              {dias.map((d) =>
                grade.slice(0, 4).map((h, i) => {
                  const livre = (d.length + i) % 3 !== 0;
                  return (
                    <button
                      key={`${d}-${h}`}
                      type="button"
                      disabled={!livre}
                      aria-label={`${d} às ${h}${livre ? "" : " — indisponível"}`}
                      className="rounded-lg border border-border bg-card py-2 text-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    >
                      {h}
                    </button>
                  );
                }),
              )}
            </div>

            <button type="button" className="btn-base btn-primary mt-7 w-full">
              Agendar consulta
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              O agendamento e o checkout serão ativados quando o provedor de pagamentos for
              configurado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Bloco({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <h3 className="eyebrow">{titulo}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
