/**
 * Valida a origem enviada pelo cliente contra os domínios oficiais da
 * plataforma. Nunca confie na origem recebida: ela é usada para montar os
 * links de retorno e de notificação do pagamento.
 */

const HOSTS_PERMITIDOS = [
  "tocbrazil.lovable.app",
  "project--166cd2f8-783a-435e-b3a6-ad12bf0f2ce8.lovable.app",
  "project--166cd2f8-783a-435e-b3a6-ad12bf0f2ce8-dev.lovable.app",
  "id-preview--166cd2f8-783a-435e-b3a6-ad12bf0f2ce8.lovable.app",
];

export const BASE_PADRAO = "https://tocbrazil.lovable.app";

function hostPermitido(host: string) {
  if (HOSTS_PERMITIDOS.includes(host)) return true;
  const dominioCustomizado = process.env["PUBLIC_SITE_URL"];
  if (dominioCustomizado) {
    try {
      if (new URL(dominioCustomizado).host === host) return true;
    } catch {
      /* ignora valor inválido */
    }
  }
  return false;
}

/** Retorna sempre uma base https confiável, ignorando origens desconhecidas. */
export function baseSegura(origem?: string | null): string {
  const configurada = process.env["PUBLIC_SITE_URL"];
  const padrao = (configurada ?? BASE_PADRAO).replace(/\/$/, "");
  if (!origem) return padrao;
  try {
    const url = new URL(origem);
    if (url.protocol !== "https:" && url.protocol !== "http:") return padrao;
    if (!hostPermitido(url.host)) return padrao;
    return `${url.protocol}//${url.host}`;
  } catch {
    return padrao;
  }
}
