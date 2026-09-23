export const ABORDAGENS_PERFIL = [
  "Exposição e Prevenção de Resposta (EPR)",
  "Terapia Cognitivo Comportamental",
  "Terapia de Aceitação e Compromisso",
  "Terapia Comportamental",
  "Psicanálise",
  "Humanista",
] as const;

export const TEMAS_TOC_PERFIL = [
  "Contaminação e limpeza",
  "Checagem e dúvida",
  "Pensamentos intrusivos",
  "Simetria e organização",
  "TOC de relacionamento",
  "TOC religioso ou escrupulosidade",
  "Acumulação relacionada ao TOC",
  "TOC no ciclo perinatal",
] as const;

export const IDIOMAS_PERFIL = ["Português", "Espanhol", "Inglês", "Libras"] as const;

export type FormacaoPublica = { instituicao: string; curso: string; ano: number };

export const TEXTO_SELO_VERIFICACAO =
  "Conferimos a inscrição ativa no Conselho Regional de Psicologia e os documentos de formação apresentados. Não avaliamos competência técnica nem garantimos resultado.";

export function crpExibicao(registro: string, uf: string) {
  const limpo = registro.trim().replace(/^CRP\s*/i, "");
  return `CRP ${limpo.includes("/") ? limpo : `${uf}/${limpo}`}`;
}