/**
 * Conteúdo educativo de demonstração. O texto é informativo, não diagnostica
 * e sempre indica que apenas um profissional qualificado pode avaliar.
 */
export type Conteudo = {
  slug: string;
  categoria: string;
  titulo: string;
  resumo: string;
  leitura: string;
  paragrafos: string[];
  fontes: string[];
};

export const CATEGORIAS = [
  "Entendendo o TOC",
  "Pensamentos intrusivos",
  "Compulsões",
  "Checagem",
  "Contaminação",
  "Relacionamentos",
  "Ansiedade",
  "Dúvidas e incertezas",
  "TOC e família",
  "TOC em adolescentes",
  "Tratamento",
  "Saúde mental",
] as const;

export const CONTEUDOS: Conteudo[] = [
  {
    slug: "o-que-e-toc",
    categoria: "Entendendo o TOC",
    titulo: "O que é o TOC, em linguagem simples",
    resumo:
      "Uma introdução ao Transtorno Obsessivo-Compulsivo: o que costuma caracterizá-lo e por que ele é difícil de explicar.",
    leitura: "6 min",
    paragrafos: [
      "O Transtorno Obsessivo-Compulsivo, conhecido como TOC, é descrito na literatura clínica pela presença de obsessões — pensamentos, imagens ou impulsos indesejados e repetitivos — e de compulsões, que são comportamentos ou rituais mentais realizados para reduzir o desconforto causado por essas obsessões.",
      "Cada pessoa pode vivenciar isso de forma bem diferente. Há quem conviva com dúvidas persistentes, quem sinta necessidade de verificar, organizar, contar ou lavar, e quem realize rituais apenas mentalmente, sem que ninguém perceba.",
      "Ter um pensamento intrusivo, isoladamente, é uma experiência comum. O que costuma ser observado no TOC é o quanto esses pensamentos passam a ocupar tempo, gerar sofrimento e interferir na rotina.",
      "Alguns comportamentos podem aparecer em pessoas com TOC, mas somente um profissional qualificado pode realizar uma avaliação. Nenhum conteúdo, teste online ou lista de sinais substitui uma consulta.",
    ],
    fontes: [
      "Organização Mundial da Saúde — Classificação Internacional de Doenças (CID-11)",
      "Manual Diagnóstico e Estatístico de Transtornos Mentais (DSM-5-TR)",
    ],
  },
  {
    slug: "pensamentos-intrusivos",
    categoria: "Pensamentos intrusivos",
    titulo: "Pensamentos intrusivos: por que eles assustam tanto",
    resumo:
      "Pensamentos indesejados podem causar vergonha e medo. Entender como eles funcionam ajuda a reduzir o julgamento sobre si mesmo.",
    leitura: "5 min",
    paragrafos: [
      "Pensamentos intrusivos são conteúdos mentais que aparecem sem convite e frequentemente contrariam aquilo que a pessoa valoriza. Justamente por isso eles causam tanto estranhamento.",
      "Uma dificuldade comum é interpretar o pensamento como se ele revelasse algo sobre o caráter ou sobre uma intenção real. Essa interpretação tende a aumentar a vigilância mental, e a vigilância aumenta a frequência com que o pensamento é notado.",
      "Buscar garantias — pesquisar, perguntar repetidamente, revisar a própria memória — pode aliviar no curto prazo e, com o tempo, reforçar o ciclo.",
      "Se esses pensamentos vêm ocupando espaço demais na sua vida, conversar com um profissional pode ser um passo importante. A avaliação é sempre individual.",
    ],
    fontes: ["Literatura científica sobre terapias cognitivo-comportamentais para TOC"],
  },
  {
    slug: "compulsoes-e-rituais",
    categoria: "Compulsões",
    titulo: "Compulsões e rituais: o alívio que costuma cobrar um preço",
    resumo:
      "Como comportamentos repetitivos se relacionam com o desconforto e por que o alívio imediato pode manter o ciclo.",
    leitura: "5 min",
    paragrafos: [
      "Compulsões são ações — visíveis ou mentais — realizadas para reduzir uma sensação de risco, dúvida ou desconforto. Podem incluir verificar, lavar, repetir, contar, rezar mentalmente ou revisar cenas na memória.",
      "O alívio geralmente vem rápido, o que faz o comportamento se repetir. Com o tempo, a exigência interna pode aumentar: mais verificações, mais tempo, mais regras.",
      "Reconhecer o ciclo não é o mesmo que resolvê-lo, e não é falta de força de vontade. Abordagens de tratamento com apoio de evidências existem e são conduzidas por profissionais habilitados.",
    ],
    fontes: ["Diretrizes internacionais de tratamento do TOC"],
  },
  {
    slug: "checagem",
    categoria: "Checagem",
    titulo: "Quando verificar deixa de ser cuidado",
    resumo:
      "Portas, fogão, e-mails, mensagens enviadas: a diferença entre conferir uma vez e ficar preso na dúvida.",
    leitura: "4 min",
    paragrafos: [
      "Conferir se a porta está trancada é comportamento comum. A dificuldade aparece quando a checagem não encerra a dúvida e precisa ser repetida para produzir alívio.",
      "Muitas pessoas relatam que, quanto mais verificam, menos confiam na própria memória. Esse é um fenômeno descrito na literatura sobre TOC.",
      "Não existe um número de verificações que defina um diagnóstico. O que importa clinicamente é o sofrimento e a interferência na vida — e isso é avaliado por um profissional.",
    ],
    fontes: ["Estudos sobre memória e comportamento de checagem no TOC"],
  },
  {
    slug: "toc-e-familia",
    categoria: "TOC e família",
    titulo: "Como a família pode apoiar sem entrar no ritual",
    resumo:
      "Familiares costumam querer ajudar e, sem perceber, participar dos rituais. Há caminhos mais sustentáveis.",
    leitura: "6 min",
    paragrafos: [
      "É comum que pessoas próximas passem a dar garantias, responder às mesmas perguntas ou assumir tarefas para reduzir o desconforto de quem sofre. Isso vem do afeto.",
      "A literatura descreve esse fenômeno como acomodação familiar, e observa que ele pode, involuntariamente, manter o ciclo.",
      "Orientação profissional pode ajudar a família a encontrar formas de apoiar que respeitem o vínculo e o processo de tratamento. Cada caso é único.",
    ],
    fontes: ["Publicações sobre acomodação familiar em TOC"],
  },
  {
    slug: "tratamento-do-toc",
    categoria: "Tratamento",
    titulo: "Como o tratamento do TOC costuma ser conduzido",
    resumo:
      "Psicoterapia, acompanhamento psiquiátrico quando indicado e a importância de um plano combinado.",
    leitura: "7 min",
    paragrafos: [
      "O tratamento do TOC é conduzido por profissionais habilitados e definido caso a caso. Em geral envolve psicoterapia e, quando indicado pelo médico, acompanhamento psiquiátrico.",
      "Abordagens psicoterapêuticas com apoio de evidências para TOC incluem intervenções cognitivo-comportamentais. A escolha depende da avaliação profissional e das preferências da pessoa.",
      "Somente um médico pode avaliar a necessidade e a indicação de medicação. Nenhuma plataforma pode fazer isso, e nós não fazemos.",
      "Nosso papel é reunir informação confiável e facilitar o acesso a profissionais para que você possa dar o próximo passo com mais segurança.",
    ],
    fontes: ["Diretrizes clínicas internacionais para transtornos relacionados ao TOC"],
  },
];
