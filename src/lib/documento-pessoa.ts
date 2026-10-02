export type TipoPessoa = "PF" | "PJ";

export const apenasDigitos = (valor: string) => valor.replace(/\D/g, "");

export function cpfValido(valor: string): boolean {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = [...cpf.slice(0, tamanho)].reduce((total, digito, indice) => total + Number(digito) * (tamanho + 1 - indice), 0);
    if (Number(cpf[tamanho]) !== ((soma * 10) % 11) % 10) return false;
  }
  return true;
}

export function cnpjValido(valor: string): boolean {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  for (const pesos of [[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]]) {
    const soma = pesos.reduce((total, peso, indice) => total + Number(cnpj[indice]) * peso, 0);
    const digito = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (Number(cnpj[pesos.length]) !== digito) return false;
  }
  return true;
}

export function formatarCpf(valor: string): string {
  return apenasDigitos(valor).slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCnpj(valor: string): string {
  return apenasDigitos(valor).slice(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}