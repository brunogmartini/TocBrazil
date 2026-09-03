/**
 * Dados de demonstração usados apenas no ambiente de desenvolvimento,
 * enquanto o cadastro e a verificação de profissionais não estão conectados
 * ao banco de dados. Nenhuma credencial aqui é real.
 */
export type Psicologo = {
  slug: string;
  nome: string;
  crp: string;
  uf: string;
  abordagem: string;
  areas: string[];
  publicos: string[];
  idiomas: string[];
  precoCentavos: number;
  experienciaAnos: number;
  apresentacao: string;
  horarios: string[];
};

export const PSICOLOGOS_DEMO: Psicologo[] = [
  {
    slug: "ana-ribeiro",
    nome: "Ana Ribeiro",
    crp: "CRP 06/000000",
    uf: "SP",
    abordagem: "Terapia Cognitivo-Comportamental",
    areas: ["TOC", "Ansiedade", "Pensamentos intrusivos"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Inglês"],
    precoCentavos: 22000,
    experienciaAnos: 9,
    apresentacao:
      "Atendo pessoas adultas em processos relacionados a ansiedade e TOC, com foco em construir um espaço seguro e um plano de acompanhamento claro.",
    horarios: ["Hoje, 18:00", "Amanhã, 09:00", "Qui, 14:00"],
  },
  {
    slug: "bruno-carvalho",
    nome: "Bruno Carvalho",
    crp: "CRP 07/000000",
    uf: "RS",
    abordagem: "Terapia de Aceitação e Compromisso",
    areas: ["TOC", "Rituais e evitações", "Estresse"],
    publicos: ["Adultos", "Jovens adultos"],
    idiomas: ["Português"],
    precoCentavos: 18000,
    experienciaAnos: 6,
    apresentacao:
      "Trabalho com foco em flexibilidade psicológica, ajudando a pessoa a retomar aquilo que é importante para ela no dia a dia.",
    horarios: ["Amanhã, 08:00", "Amanhã, 19:00", "Sex, 11:00"],
  },
  {
    slug: "carla-nunes",
    nome: "Carla Nunes",
    crp: "CRP 01/000000",
    uf: "DF",
    abordagem: "Psicanálise",
    areas: ["Ansiedade", "Relacionamentos", "Luto"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Espanhol"],
    precoCentavos: 25000,
    experienciaAnos: 14,
    apresentacao:
      "Escuta cuidadosa e continuada, respeitando o tempo de cada pessoa no processo de análise.",
    horarios: ["Qua, 10:00", "Qui, 16:00", "Sex, 08:00"],
  },
  {
    slug: "daniel-souza",
    nome: "Daniel Souza",
    crp: "CRP 04/000000",
    uf: "MG",
    abordagem: "Terapia Cognitivo-Comportamental",
    areas: ["TOC", "Pânico", "Sono"],
    publicos: ["Adultos", "Adolescentes"],
    idiomas: ["Português"],
    precoCentavos: 16000,
    experienciaAnos: 4,
    apresentacao:
      "Atendimento online estruturado, com combinados claros sobre objetivos e frequência das sessões.",
    horarios: ["Hoje, 20:00", "Ter, 13:00", "Qua, 17:00"],
  },
  {
    slug: "elisa-tanaka",
    nome: "Elisa Tanaka",
    crp: "CRP 06/000001",
    uf: "SP",
    abordagem: "Terapia Comportamental",
    areas: ["TOC", "Ansiedade", "Trabalho e carreira"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Japonês"],
    precoCentavos: 28000,
    experienciaAnos: 11,
    apresentacao:
      "Acompanhamento com base em evidências e planejamento colaborativo de cada etapa do processo.",
    horarios: ["Amanhã, 12:00", "Qui, 09:00", "Sáb, 10:00"],
  },
  {
    slug: "felipe-moraes",
    nome: "Felipe Moraes",
    crp: "CRP 05/000000",
    uf: "RJ",
    abordagem: "Humanista",
    areas: ["Ansiedade", "Autoconhecimento", "Relacionamentos"],
    publicos: ["Adultos", "Casais"],
    idiomas: ["Português", "Inglês"],
    precoCentavos: 20000,
    experienciaAnos: 8,
    apresentacao:
      "Um espaço de acolhimento para falar do que pesa, no seu ritmo, sem julgamento.",
    horarios: ["Ter, 09:00", "Qua, 15:00", "Sex, 18:00"],
  },
];

export const formatarPreco = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
