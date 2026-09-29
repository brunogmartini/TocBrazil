export const TAXA_FIXA_CENTAVOS = 2700;

export function valorProfissionalCentavos(valorConsultaCentavos: number) {
  return Math.max(0, Math.round(valorConsultaCentavos) - TAXA_FIXA_CENTAVOS);
}