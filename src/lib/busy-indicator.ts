/**
 * Indicador global de "carregando" para botões.
 *
 * Quando a pessoa clica em um botão (ou link com aparência de botão) e, logo
 * em seguida, o site faz uma requisição ao servidor, o botão recebe
 * `data-busy` até todas as requisições iniciadas por esse clique terminarem.
 * O CSS em styles.css desenha o círculo girando e bloqueia cliques repetidos.
 */

/** Tempo máximo entre o clique e o início da requisição para atribuí-la ao botão. */
export const JANELA_CLIQUE_MS = 600;

export function requisicaoPertenceAoClique(cliqueEm: number | null, requisicaoEm: number): boolean {
  if (cliqueEm === null) return false;
  const diferenca = requisicaoEm - cliqueEm;
  return diferenca >= 0 && diferenca <= JANELA_CLIQUE_MS;
}

const SELETOR = "button, [role='button'], a.btn-base, input[type='submit']";

export function instalarIndicadorDeCarregamento(): () => void {
  if (typeof window === "undefined") return () => {};
  let ultimoAlvo: HTMLElement | null = null;
  let ultimoCliqueEm: number | null = null;
  const pendentes = new Map<HTMLElement, number>();

  const aoClicar = (evento: Event) => {
    const alvo = (evento.target as Element | null)?.closest?.(SELETOR) as HTMLElement | null;
    if (!alvo) return;
    ultimoAlvo = alvo;
    ultimoCliqueEm = performance.now();
  };
  const aoEnviar = (evento: Event) => {
    const form = evento.target as HTMLFormElement | null;
    const botao = (evento as SubmitEvent).submitter ?? form?.querySelector?.("button[type='submit'], button:not([type])");
    if (botao instanceof HTMLElement) {
      ultimoAlvo = botao;
      ultimoCliqueEm = performance.now();
    }
  };

  const marcar = (alvo: HTMLElement) => {
    pendentes.set(alvo, (pendentes.get(alvo) ?? 0) + 1);
    alvo.setAttribute("data-busy", "");
    alvo.setAttribute("aria-busy", "true");
  };
  const liberar = (alvo: HTMLElement) => {
    const restante = (pendentes.get(alvo) ?? 1) - 1;
    if (restante > 0) {
      pendentes.set(alvo, restante);
      return;
    }
    pendentes.delete(alvo);
    alvo.removeAttribute("data-busy");
    alvo.removeAttribute("aria-busy");
  };

  const fetchOriginal = window.fetch;
  const fetchMonitorado: typeof window.fetch = (...args) => {
    const alvo = ultimoAlvo;
    const atribuir = alvo !== null && alvo.isConnected && requisicaoPertenceAoClique(ultimoCliqueEm, performance.now());
    if (atribuir) marcar(alvo);
    const resposta = fetchOriginal.apply(window, args);
    if (atribuir) {
      // Mantém o indicador até a resposta chegar; telas seguintes cuidam do resultado.
      resposta.then(() => liberar(alvo), () => liberar(alvo));
    }
    return resposta;
  };
  window.fetch = fetchMonitorado;
  document.addEventListener("click", aoClicar, true);
  document.addEventListener("submit", aoEnviar, true);

  return () => {
    if (window.fetch === fetchMonitorado) window.fetch = fetchOriginal;
    document.removeEventListener("click", aoClicar, true);
    document.removeEventListener("submit", aoEnviar, true);
    for (const alvo of pendentes.keys()) {
      alvo.removeAttribute("data-busy");
      alvo.removeAttribute("aria-busy");
    }
    pendentes.clear();
  };
}
