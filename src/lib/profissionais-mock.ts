/**
 * Dados de demonstração usados apenas no ambiente de desenvolvimento,
 * enquanto o cadastro e a verificação de profissionais não estão conectados
 * ao banco de dados. Nenhuma credencial aqui é real.
 */
export type Profissao = "Psicólogo(a)" | "Psiquiatra";

export type Profissional = {
  slug: string;
  nome: string;
  profissao: Profissao;
  registro: string;
  uf: string;
  abordagem: string | null;
  formacao: string[];
  areas: string[];
  publicos: string[];
  idiomas: string[];
  genero: "Feminino" | "Masculino" | "Não informado";
  estilo: "Mais estruturado" | "Mais exploratório";
  didatico: boolean;
  precoCentavos: number;
  experienciaAnos: number;
  apresentacao: string;
  horarios: string[];
  politicaCancelamento: string;
};

export const PROFISSIONAIS_DEMO: Profissional[] = [
  {
    slug: "ana-ribeiro",
    nome: "Ana Ribeiro",
    profissao: "Psicólogo(a)",
    registro: "CRP 06/000000",
    uf: "SP",
    abordagem: "Terapia Cognitivo-Comportamental",
    formacao: ["Graduação em Psicologia", "Especialização em Terapias Comportamentais"],
    areas: ["TOC", "Pensamentos intrusivos", "Ansiedade"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Inglês"],
    genero: "Feminino",
    estilo: "Mais estruturado",
    didatico: true,
    precoCentavos: 22000,
    experienciaAnos: 9,
    apresentacao:
      "Atendo pessoas adultas em processos relacionados a ansiedade e TOC, com foco em construir um espaço seguro e um plano de acompanhamento claro.",
    horarios: ["Hoje, 18:00", "Amanhã, 09:00", "Qui, 14:00"],
    politicaCancelamento: "Cancelamento sem custo até 24h antes da sessão.",
  },
  {
    slug: "bruno-carvalho",
    nome: "Bruno Carvalho",
    profissao: "Psicólogo(a)",
    registro: "CRP 07/000000",
    uf: "RS",
    abordagem: "Terapia de Aceitação e Compromisso",
    formacao: ["Graduação em Psicologia", "Formação em ACT"],
    areas: ["TOC", "Rituais e evitações", "Estresse"],
    publicos: ["Adultos", "Jovens adultos"],
    idiomas: ["Português"],
    genero: "Masculino",
    estilo: "Mais exploratório",
    didatico: true,
    precoCentavos: 18000,
    experienciaAnos: 6,
    apresentacao:
      "Trabalho com foco em flexibilidade psicológica, ajudando a pessoa a retomar aquilo que é importante para ela no dia a dia.",
    horarios: ["Amanhã, 08:00", "Amanhã, 19:00", "Sex, 11:00"],
    politicaCancelamento: "Cancelamento sem custo até 12h antes da sessão.",
  },
  {
    slug: "carla-nunes",
    nome: "Carla Nunes",
    profissao: "Psicólogo(a)",
    registro: "CRP 01/000000",
    uf: "DF",
    abordagem: "Psicanálise",
    formacao: ["Graduação em Psicologia", "Formação em Psicanálise"],
    areas: ["Ansiedade", "Dúvidas e incertezas", "Relacionamentos"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Espanhol"],
    genero: "Feminino",
    estilo: "Mais exploratório",
    didatico: false,
    precoCentavos: 25000,
    experienciaAnos: 14,
    apresentacao:
      "Escuta cuidadosa e continuada, respeitando o tempo de cada pessoa no processo de análise.",
    horarios: ["Qua, 10:00", "Qui, 16:00", "Sex, 08:00"],
    politicaCancelamento: "Cancelamento sem custo até 24h antes da sessão.",
  },
  {
    slug: "daniel-souza",
    nome: "Daniel Souza",
    profissao: "Psicólogo(a)",
    registro: "CRP 04/000000",
    uf: "MG",
    abordagem: "Terapia Cognitivo-Comportamental",
    formacao: ["Graduação em Psicologia", "Especialização em TCC"],
    areas: ["TOC", "Checagem", "Sono"],
    publicos: ["Adultos", "Adolescentes"],
    idiomas: ["Português"],
    genero: "Masculino",
    estilo: "Mais estruturado",
    didatico: true,
    precoCentavos: 16000,
    experienciaAnos: 4,
    apresentacao:
      "Atendimento online estruturado, com combinados claros sobre objetivos e frequência das sessões.",
    horarios: ["Hoje, 20:00", "Ter, 13:00", "Qua, 17:00"],
    politicaCancelamento: "Cancelamento sem custo até 24h antes da sessão.",
  },
  {
    slug: "elisa-tanaka",
    nome: "Elisa Tanaka",
    profissao: "Psicólogo(a)",
    registro: "CRP 06/000001",
    uf: "SP",
    abordagem: "Terapia Comportamental",
    formacao: ["Graduação em Psicologia", "Mestrado em Psicologia Clínica"],
    areas: ["TOC", "Contaminação", "Trabalho e carreira"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Japonês"],
    genero: "Feminino",
    estilo: "Mais estruturado",
    didatico: false,
    precoCentavos: 28000,
    experienciaAnos: 11,
    apresentacao:
      "Acompanhamento com base em evidências e planejamento colaborativo de cada etapa do processo.",
    horarios: ["Amanhã, 12:00", "Qui, 09:00", "Sáb, 10:00"],
    politicaCancelamento: "Cancelamento sem custo até 48h antes da sessão.",
  },
  {
    slug: "felipe-moraes",
    nome: "Felipe Moraes",
    profissao: "Psicólogo(a)",
    registro: "CRP 05/000000",
    uf: "RJ",
    abordagem: "Terapia Cognitivo-Comportamental",
    formacao: ["Graduação em Psicologia", "Especialização em Ansiedade"],
    areas: ["TOC e família", "Ansiedade", "Autoconhecimento"],
    publicos: ["Adultos", "Familiares"],
    idiomas: ["Português", "Inglês"],
    genero: "Masculino",
    estilo: "Mais exploratório",
    didatico: true,
    precoCentavos: 20000,
    experienciaAnos: 8,
    apresentacao:
      "Um espaço de acolhimento para falar do que pesa, no seu ritmo, sem julgamento.",
    horarios: ["Ter, 09:00", "Qua, 15:00", "Sex, 18:00"],
    politicaCancelamento: "Cancelamento sem custo até 24h antes da sessão.",
  },
  {
    slug: "helena-vasques",
    nome: "Helena Vasques",
    profissao: "Psiquiatra",
    registro: "CRM 000000/SP",
    uf: "SP",
    abordagem: null,
    formacao: ["Graduação em Medicina", "Residência em Psiquiatria"],
    areas: ["TOC", "Ansiedade", "Saúde mental"],
    publicos: ["Adultos"],
    idiomas: ["Português", "Inglês"],
    genero: "Feminino",
    estilo: "Mais estruturado",
    didatico: true,
    precoCentavos: 45000,
    experienciaAnos: 12,
    apresentacao:
      "Avaliação e acompanhamento psiquiátrico online, com atenção à história de cada pessoa e à articulação com a psicoterapia.",
    horarios: ["Amanhã, 10:00", "Qui, 11:00", "Sex, 15:00"],
    politicaCancelamento: "Cancelamento sem custo até 48h antes da consulta.",
  },
  {
    slug: "rodrigo-lemos",
    nome: "Rodrigo Lemos",
    profissao: "Psiquiatra",
    registro: "CRM 000000/PR",
    uf: "PR",
    abordagem: null,
    formacao: ["Graduação em Medicina", "Residência em Psiquiatria"],
    areas: ["TOC", "TOC em adolescentes", "Saúde mental"],
    publicos: ["Adultos", "Adolescentes"],
    idiomas: ["Português"],
    genero: "Masculino",
    estilo: "Mais estruturado",
    didatico: false,
    precoCentavos: 39000,
    experienciaAnos: 7,
    apresentacao:
      "Consultas online com foco em avaliação cuidadosa, plano de acompanhamento e retorno claro sobre cada etapa.",
    horarios: ["Hoje, 19:00", "Qua, 08:00", "Sáb, 09:00"],
    politicaCancelamento: "Cancelamento sem custo até 24h antes da consulta.",
  },
];

export const formatarPreco = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
