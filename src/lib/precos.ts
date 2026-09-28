export const TAXA_FIXA_CENTAVOS = 2700;

export function precoPublicoCentavos(valorLiquidoCentavos: number) {
  return Math.max(0, Math.round(valorLiquidoCentavos)) + TAXA_FIXA_CENTAVOS;
}