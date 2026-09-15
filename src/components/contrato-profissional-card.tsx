import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { assinarContratoProfissional } from "@/lib/profissional.functions";
import {
  CLAUSULAS_CONTRATO,
  DATA_VERSAO_CONTRATO,
  DECLARACOES_ACEITE,
  PREAMBULO_CONTRATO,
  TITULO_CONTRATO,
  VERSAO_CONTRATO,
} from "@/lib/contrato-profissional";

type ContratoAssinado = {
  versao: string;
  nome_assinatura: string;
  aceito_em: string;
} | null;

export function ContratoProfissionalCard({
  contrato,
  habilitado,
}: {
  contrato: ContratoAssinado;
  habilitado: boolean;
}) {
  const queryClient = useQueryClient();
  const assinar = useServerFn(assinarContratoProfissional);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [marcados, setMarcados] = useState<boolean[]>(DECLARACOES_ACEITE.map(() => false));
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const assinadoAtual = contrato?.versao === VERSAO_CONTRATO;
  const todasMarcadas = marcados.every(Boolean);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await assinar({ data: { nome_assinatura: nome, documento } });
      if (!r.ok) setErro(r.erro);
      else await queryClient.invalidateQueries({ queryKey: ["cadastro-profissional"] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível assinar agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="heading-section">Contrato do profissional</h2>
      <div className="card-soft mt-5 p-7">
        {assinadoAtual ? (
          <div className="space-y-2 text-sm">
            <span className="pill">Contrato assinado</span>
            <p className="text-muted-foreground">
              Assinado eletronicamente por <strong>{contrato!.nome_assinatura}</strong> em{" "}
              {new Date(contrato!.aceito_em).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}{" "}
              · versão {contrato!.versao}
            </p>
            <button
              type="button"
              className="text-sm underline underline-offset-4"
              onClick={() => setAberto((v) => !v)}
            >
              {aberto ? "Ocultar contrato" : "Ler o contrato assinado"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Antes de enviar seus documentos, leia e assine o contrato de prestação de serviços de
            intermediação. Versão {VERSAO_CONTRATO} · {DATA_VERSAO_CONTRATO}.
          </p>
        )}

        {(!assinadoAtual || aberto) && (
          <div className="mt-6 max-h-96 overflow-y-auto rounded-lg border border-border bg-background p-5 text-sm leading-relaxed">
            <h3 className="heading-card">{TITULO_CONTRATO}</h3>
            <p className="mt-3 text-muted-foreground">{PREAMBULO_CONTRATO}</p>
            {CLAUSULAS_CONTRATO.map((c) => (
              <div key={c.titulo} className="mt-5">
                <h4 className="font-semibold">{c.titulo}</h4>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  {c.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!assinadoAtual && (
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <ul className="space-y-3">
              {DECLARACOES_ACEITE.map((texto, i) => (
                <li key={texto} className="flex gap-3 text-sm">
                  <input
                    id={`declaracao-${i}`}
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0"
                    checked={marcados[i]}
                    onChange={(e) =>
                      setMarcados((m) => m.map((v, j) => (j === i ? e.target.checked : v)))
                    }
                  />
                  <label htmlFor={`declaracao-${i}`}>{texto}</label>
                </li>
              ))}
            </ul>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="assinatura-nome" className="section-label">
                  Assinatura (digite seu nome completo)
                </label>
                <input
                  id="assinatura-nome"
                  className="field-base mt-2"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="assinatura-cpf" className="section-label">
                  CPF
                </label>
                <input
                  id="assinatura-cpf"
                  inputMode="numeric"
                  className="field-base mt-2"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                />
              </div>
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            {!habilitado && (
              <p className="text-sm text-muted-foreground">
                Salve seu cadastro acima para liberar a assinatura.
              </p>
            )}
            <button
              type="submit"
              className="btn-base btn-primary"
              disabled={!habilitado || !todasMarcadas || enviando}
            >
              {enviando ? "Registrando…" : "Concordar e assinar"}
            </button>
            <p className="text-xs text-muted-foreground">
              Ao assinar, registramos data, hora, endereço de rede e dispositivo do aceite como
              prova da sua manifestação de vontade.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
