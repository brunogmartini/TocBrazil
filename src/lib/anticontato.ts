export type TipoAnticontato =
  | "telefone"
  | "numero_por_extenso"
  | "email"
  | "url"
  | "arroba"
  | "termo_contato";

export type DeteccaoAnticontato = {
  tipo: TipoAnticontato;
  trecho: string;
  bloqueiaChat: boolean;
};

const NUMEROS =
  "zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento";
const ENCURTADORES = "bit\\.ly|tinyurl\\.com|t\\.me|wa\\.me|goo\\.gl|is\\.gd|cutt\\.ly|linktr\\.ee";

const PADROES: Array<{
  tipo: TipoAnticontato;
  regex: RegExp;
  bloqueiaChat: boolean;
}> = [
  {
    tipo: "email",
    regex: /\b[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}\b/giu,
    bloqueiaChat: true,
  },
  {
    tipo: "url",
    regex: new RegExp(
      `(?:https?:\\/\\/|www\\.)[^\\s]+|\\b(?:${ENCURTADORES})(?:\\/[^\\s]*)?|\\b[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:com\\.br|com|net\\.br|net|org\\.br|org|br|io|me)(?:\\/[^\\s]*)?`,
      "giu",
    ),
    bloqueiaChat: true,
  },
  {
    tipo: "arroba",
    regex: /(^|\s)@[a-z0-9._-]{2,}/giu,
    bloqueiaChat: true,
  },
  {
    tipo: "telefone",
    regex: /(?<!\d)(?:\+?\d[\s().-]*){8,13}(?!\d)/g,
    bloqueiaChat: true,
  },
  {
    tipo: "numero_por_extenso",
    regex: new RegExp(`\\b(?:${NUMEROS})(?:\\s+(?:e\\s+)?(?:${NUMEROS})){1,}\\b`, "giu"),
    bloqueiaChat: true,
  },
  {
    tipo: "termo_contato",
    regex:
      /\b(?:whatsapp|whats|zap|wpp|insta|instagram|telegram|direct|me chama|me chame|meu contato|fora da plataforma|por fora|meu pix)\b/giu,
    bloqueiaChat: false,
  },
];

function trechoSeguro(valor: string) {
  return valor.trim().replace(/\s+/g, " ").slice(0, 48);
}

export function detectarAnticontato(texto: string): DeteccaoAnticontato[] {
  const encontrados: DeteccaoAnticontato[] = [];
  const vistos = new Set<string>();
  for (const padrao of PADROES) {
    padrao.regex.lastIndex = 0;
    for (const correspondencia of texto.matchAll(padrao.regex)) {
      const trecho = trechoSeguro(correspondencia[0]);
      const chave = `${padrao.tipo}:${trecho.toLocaleLowerCase("pt-BR")}`;
      if (!trecho || vistos.has(chave)) continue;
      vistos.add(chave);
      encontrados.push({ tipo: padrao.tipo, trecho, bloqueiaChat: padrao.bloqueiaChat });
    }
  }
  return encontrados;
}

export function primeiraDeteccaoPerfil(campos: Array<string | null | undefined>) {
  for (const campo of campos) {
    const deteccao = detectarAnticontato(campo ?? "")[0];
    if (deteccao) return deteccao;
  }
  return null;
}

export const ROTULO_ANTICONTATO: Record<TipoAnticontato, string> = {
  telefone: "telefone ou sequência numérica",
  numero_por_extenso: "número escrito por extenso",
  email: "e-mail",
  url: "link ou endereço de site",
  arroba: "nome de usuário com @",
  termo_contato: "expressão de contato fora da plataforma",
};