export const TAXA_FIXA_CENTAVOS = 2700;

// Taxa de não comparecimento (no-show): cobrada quando a consulta não ocorre por
// falta do paciente. Do valor total pago, retém-se esta taxa e o restante vira
// crédito do paciente, reembolsável sob demanda.
export const NO_SHOW_FEE_CENTAVOS = 5000;
export const NO_SHOW_PLATAFORMA_CENTAVOS = 1000;
export const NO_SHOW_PROFISSIONAL_CENTAVOS = 4000;

export function valorProfissionalCentavos(valorConsultaCentavos: number) {
  return Math.max(0, Math.round(valorConsultaCentavos) - TAXA_FIXA_CENTAVOS);
}
