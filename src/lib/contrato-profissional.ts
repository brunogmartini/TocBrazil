export const VERSAO_CONTRATO = "rascunho-inativo";
export const DATA_VERSAO_CONTRATO = "A definir";

export type ClausulaContrato = { titulo: string; itens: string[] };

export const TITULO_CONTRATO =
  "Termo profissional — etapa futura";

export const PREAMBULO_CONTRATO =
  "O aceite contratual do profissional está desativado no site e será incluído como última etapa do cadastro em uma fase posterior.";

export const CLAUSULAS_CONTRATO: ClausulaContrato[] = [
  {
    titulo: "Status",
    itens: [
      "A TOC Brazil atua como empresa de tecnologia para busca, agendamento e pagamento.",
      "A consulta acontece na sala de videochamada contratada e mantida pelo próprio psicólogo.",
      "O texto definitivo será revisado antes de ser publicado no cadastro profissional.",
    ],
  },
];

export const TEXTO_ACEITE_CONTRATO =
  "Aceite contratual temporariamente indisponível.";
