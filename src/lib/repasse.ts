import { apenasDigitos, cnpjValido, cpfValido } from "@/lib/documento-pessoa";

export type TipoChavePix = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
export type MetodoRepasse = "pix" | "banco";

export type EntradaRepasse = {
  metodo: MetodoRepasse;
  pixTipo?: TipoChavePix | null | undefined;
  pixChave?: string | null | undefined;
  bancoCodigo?: string | null | undefined;
  agencia?: string | null | undefined;
  conta?: string | null | undefined;
  tipoConta?: "corrente" | "poupanca" | null | undefined;
  titularNome: string;
  titularDocumento: string;
};

export type DadosRepasse = {
  metodo: MetodoRepasse;
  pix_tipo: TipoChavePix | null;
  pix_chave: string | null;
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: "corrente" | "poupanca" | null;
  titular_nome: string;
  titular_documento: string;
};

export const ROTULO_CHAVE_PIX: Record<TipoChavePix, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Celular",
  aleatoria: "Chave aleatória",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALEATORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function normalizarChavePix(tipo: TipoChavePix, chave: string): string | null {
  const valor = chave.trim();
  if (tipo === "cpf") return cpfValido(valor) ? apenasDigitos(valor) : null;
  if (tipo === "cnpj") return cnpjValido(valor) ? apenasDigitos(valor) : null;
  if (tipo === "email") return EMAIL.test(valor) && valor.length <= 120 ? valor.toLowerCase() : null;
  if (tipo === "aleatoria") return ALEATORIA.test(valor.toLowerCase()) ? valor.toLowerCase() : null;
  let digitos = apenasDigitos(valor);
  if (digitos.length === 13 && digitos.startsWith("55")) digitos = digitos.slice(2);
  return digitos.length === 11 ? `+55${digitos}` : null;
}

/**
 * Valida os dados para repasse manual. O titular precisa ser o próprio
 * profissional (CPF) ou a empresa dele (CNPJ) — nunca terceiros.
 */
export function validarDadosRepasse(
  entrada: EntradaRepasse,
  profissional: { cpf: string | null; cnpj: string | null },
): { ok: true; dados: DadosRepasse } | { ok: false; erro: string } {
  const titularNome = entrada.titularNome.trim().replace(/\s+/g, " ");
  if (titularNome.length < 3 || titularNome.length > 120) return { ok: false, erro: "Informe o nome completo do titular." };
  const titularDocumento = apenasDigitos(entrada.titularDocumento);
  const documentoValido = titularDocumento.length === 11 ? cpfValido(titularDocumento) : titularDocumento.length === 14 && cnpjValido(titularDocumento);
  if (!documentoValido) return { ok: false, erro: "Informe um CPF ou CNPJ válido do titular." };
  const proprios = [profissional.cpf, profissional.cnpj].filter(Boolean).map((v) => apenasDigitos(v as string));
  if (!proprios.includes(titularDocumento)) {
    return { ok: false, erro: "A conta precisa estar no seu CPF ou no CNPJ informado no cadastro." };
  }
  if (entrada.metodo === "pix") {
    if (!entrada.pixTipo || !(entrada.pixTipo in ROTULO_CHAVE_PIX)) return { ok: false, erro: "Escolha o tipo da chave Pix." };
    const chave = normalizarChavePix(entrada.pixTipo, entrada.pixChave ?? "");
    if (!chave) return { ok: false, erro: `A chave Pix (${ROTULO_CHAVE_PIX[entrada.pixTipo]}) não é válida.` };
    return { ok: true, dados: { metodo: "pix", pix_tipo: entrada.pixTipo, pix_chave: chave, banco_codigo: null, agencia: null, conta: null, tipo_conta: null, titular_nome: titularNome, titular_documento: titularDocumento } };
  }
  const banco = apenasDigitos(entrada.bancoCodigo ?? "");
  if (banco.length !== 3) return { ok: false, erro: "Informe o código do banco com 3 dígitos." };
  const agencia = apenasDigitos(entrada.agencia ?? "");
  if (agencia.length < 1 || agencia.length > 5) return { ok: false, erro: "Informe a agência sem o dígito (até 5 números)." };
  const contaBruta = (entrada.conta ?? "").toUpperCase().replace(/[^0-9X]/g, "");
  if (contaBruta.length < 2 || contaBruta.length > 13 || contaBruta.slice(0, -1).includes("X")) {
    return { ok: false, erro: "Informe a conta com o dígito." };
  }
  if (entrada.tipoConta !== "corrente" && entrada.tipoConta !== "poupanca") return { ok: false, erro: "Escolha conta corrente ou poupança." };
  return { ok: true, dados: { metodo: "banco", pix_tipo: null, pix_chave: null, banco_codigo: banco, agencia, conta: `${contaBruta.slice(0, -1)}-${contaBruta.slice(-1)}`, tipo_conta: entrada.tipoConta, titular_nome: titularNome, titular_documento: titularDocumento } };
}

export function descreverRepasse(d: DadosRepasse): string {
  if (d.metodo === "pix" && d.pix_tipo) return `Pix (${ROTULO_CHAVE_PIX[d.pix_tipo]}): ${d.pix_chave}`;
  return `Banco ${d.banco_codigo} · agência ${d.agencia} · conta ${d.tipo_conta === "poupanca" ? "poupança" : "corrente"} ${d.conta}`;
}
