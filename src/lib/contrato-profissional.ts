export const VERSAO_CONTRATO = "1.0";
export const DATA_VERSAO_CONTRATO = "15/09/2026";

export type ClausulaContrato = { titulo: string; itens: string[] };

export const TITULO_CONTRATO =
  "Termo de Adesão e Contrato de Prestação de Serviços de Intermediação — TOC Brazil";

export const PREAMBULO_CONTRATO =
  "Este instrumento é celebrado entre a TOC BRAZIL, plataforma digital que opera o site tocbrazil.com.br (doravante \"Plataforma\"), e o profissional da saúde mental que adere a este termo por meio de aceite eletrônico (doravante \"Profissional\"). Ao assinar eletronicamente, o Profissional declara ter lido, compreendido e aceito integralmente todas as cláusulas abaixo, que passam a reger sua relação com a Plataforma.";

export const CLAUSULAS_CONTRATO: ClausulaContrato[] = [
  {
    titulo: "1. Objeto e natureza da relação",
    itens: [
      "1.1. A Plataforma presta exclusivamente serviços de intermediação tecnológica, divulgação de perfis, agendamento, processamento de pagamentos e disponibilização de ambiente de teleconsulta, conectando pacientes a profissionais da saúde mental com experiência em Transtorno Obsessivo-Compulsivo (TOC).",
      "1.2. A Plataforma NÃO presta serviços de saúde, não realiza atendimento clínico, não emite diagnóstico, não prescreve tratamento e não interfere na conduta técnica do Profissional.",
      "1.3. Este contrato não gera vínculo empregatício, societário, de subordinação, exclusividade, representação ou consórcio entre as partes. O Profissional atua como prestador autônomo e independente, com plena autonomia técnica, científica e de agenda.",
      "1.4. Não há garantia de volume mínimo de pacientes, de agendamentos, de faturamento ou de continuidade de exibição do perfil.",
    ],
  },
  {
    titulo: "2. Responsabilidade integral e exclusiva do Profissional",
    itens: [
      "2.1. O Profissional é única, integral e exclusivamente responsável por todos os serviços de saúde que presta, incluindo avaliação, diagnóstico, indicação terapêutica, condução das sessões, prescrição (quando cabível), encaminhamentos, registros clínicos e desfechos do tratamento.",
      "2.2. O Profissional responde civil, criminal, ética, administrativa, tributária e regulatoriamente por seus atos e omissões, perante o paciente, perante seu conselho de classe e perante quaisquer autoridades.",
      "2.3. O Profissional declara estar regularmente inscrito e ativo em seu conselho profissional (CRP ou CRM), sem qualquer impedimento, suspensão ou sanção que o impeça de exercer a profissão, e obriga-se a comunicar imediatamente à Plataforma qualquer alteração dessa situação.",
      "2.4. O Profissional declara que todas as informações, documentos, títulos, formações e experiências informados são verdadeiros, atuais e autênticos, respondendo integralmente por eventual falsidade.",
      "2.5. O Profissional obriga-se a observar a legislação aplicável e as normas de seus conselhos de classe sobre atendimento on-line, sigilo profissional, prontuário, publicidade e conduta ética.",
      "2.6. O Profissional é responsável por gerenciar situações de risco (ideação suicida, urgências psiquiátricas, risco a terceiros, suspeita de violência) conforme os protocolos técnicos e legais aplicáveis, acionando a rede de urgência quando necessário. A Plataforma não é serviço de emergência.",
      "2.7. O Profissional isenta a Plataforma de qualquer responsabilidade por resultados terapêuticos e assume, desde já, a obrigação de indenizar e manter a Plataforma indene (incluindo custas, honorários e acordos) em relação a qualquer reclamação, notificação, processo judicial, administrativo ou ético decorrente de sua atuação profissional ou do descumprimento deste contrato.",
    ],
  },
  {
    titulo: "3. Proibição de desvio de pacientes e atendimento fora da Plataforma",
    itens: [
      "3.1. É EXPRESSAMENTE PROIBIDO ao Profissional solicitar, sugerir, aceitar ou registrar contato particular do paciente (telefone pessoal, WhatsApp, e-mail privado, redes sociais, endereço, link de reunião próprio ou qualquer outro canal externo) com o objetivo de atendê-lo fora da Plataforma.",
      "3.2. É EXPRESSAMENTE PROIBIDO realizar, agendar, cobrar ou receber pagamento por consultas fora do ambiente da Plataforma com pacientes que tenham chegado ao Profissional por meio da Plataforma, ainda que a pedido do próprio paciente e ainda que sob desconto, gratuidade, permuta ou qualquer outra forma.",
      "3.3. É igualmente proibido divulgar ao paciente valores, formas de pagamento, agenda ou canais paralelos, bem como induzir o paciente a cancelar consultas para atendê-lo por fora.",
      "3.4. Esta obrigação de não desvio vigora enquanto o Profissional estiver cadastrado e permanece por 24 (vinte e quatro) meses após o encerramento do cadastro, em relação a todo paciente que tenha sido apresentado ao Profissional pela Plataforma.",
      "3.5. Caso o paciente já fosse comprovadamente paciente do Profissional antes do primeiro contato pela Plataforma, esta cláusula não se aplica àquele paciente, cabendo ao Profissional o ônus de comprovar a anterioridade do vínculo.",
      "3.6. O descumprimento de qualquer item desta cláusula 3 caracteriza infração grave e sujeita o Profissional, cumulativamente: (i) à suspensão ou exclusão imediata do cadastro; (ii) ao pagamento de multa não compensatória equivalente a 20 (vinte) vezes o valor da sessão anunciada por consulta desviada, com mínimo de R$ 5.000,00 (cinco mil reais) por paciente desviado; (iii) ao pagamento das comissões que a Plataforma deixou de receber; e (iv) à indenização por perdas e danos que excederem a multa.",
      "3.7. A Plataforma poderá auditar mensagens, agendamentos, cancelamentos e avaliações para apurar indícios de desvio, respeitada a legislação de proteção de dados e o sigilo do conteúdo clínico.",
    ],
  },
  {
    titulo: "4. Cadastro, análise documental e publicação do perfil",
    itens: [
      "4.1. O cadastro somente é publicado após análise documental pela equipe da Plataforma, que pode aprovar, solicitar correções, recusar, suspender ou despublicar o perfil, a seu critério fundamentado, a qualquer momento.",
      "4.2. Os documentos enviados são utilizados exclusivamente para verificação de identidade, habilitação e formação, com acesso restrito à equipe responsável.",
      "4.3. O Profissional é responsável por manter cadastro, valores, agenda e disponibilidade atualizados, evitando agendamentos que não possa cumprir.",
    ],
  },
  {
    titulo: "5. Valores, comissão e repasses",
    itens: [
      "5.1. O Profissional declara no cadastro o valor líquido que deseja receber por sessão. Sobre esse valor a Plataforma aplica seu percentual de intermediação, formando o preço exibido ao paciente no site.",
      "5.2. O pagamento do paciente é processado pelos meios oficiais da Plataforma e de seus provedores de pagamento. É vedado ao Profissional cobrar o paciente por qualquer outro meio.",
      "5.3. O repasse é realizado após a confirmação da consulta como realizada e após a liquidação financeira pelo provedor de pagamento, conforme os prazos informados no painel do Profissional.",
      "5.4. A Plataforma pode retomar, compensar ou descontar de repasses futuros valores relativos a estornos, chargebacks, reembolsos ao paciente, fraudes, multas e comissões devidas.",
      "5.5. O Profissional é o único responsável por suas obrigações fiscais e tributárias, incluindo emissão de documento fiscal ao paciente quando exigido, recolhimento de tributos e contribuições previdenciárias.",
      "5.6. A Plataforma pode reajustar seu percentual de intermediação mediante comunicação prévia de 30 (trinta) dias; a permanência do cadastro após esse prazo implica aceite.",
    ],
  },
  {
    titulo: "6. Agenda, cancelamentos e faltas",
    itens: [
      "6.1. O Profissional obriga-se a comparecer pontualmente às consultas confirmadas e a manter ambiente adequado, privativo e com conexão suficiente para a teleconsulta.",
      "6.2. Cancelamentos, remarcações, reembolsos e ausências seguem as regras publicadas na Plataforma, que integram este contrato.",
      "6.3. Faltas reiteradas, atrasos, cancelamentos abusivos ou avaliações consistentemente negativas podem levar à suspensão ou exclusão do cadastro.",
    ],
  },
  {
    titulo: "7. Sigilo, prontuário e proteção de dados (LGPD)",
    itens: [
      "7.1. O Profissional obriga-se a manter absoluto sigilo sobre todas as informações do paciente, inclusive após o término deste contrato.",
      "7.2. No tratamento de dados pessoais e dados sensíveis de saúde, o Profissional atua como controlador dos dados clínicos que produz, e a Plataforma como controladora dos dados de cadastro, agendamento e pagamento, cabendo a cada parte cumprir a Lei nº 13.709/2018 (LGPD) no que lhe compete.",
      "7.3. O Profissional é responsável pela guarda, segurança e tempo de retenção de seus registros clínicos, conforme as normas de seu conselho de classe.",
      "7.4. É proibido gravar sessões sem consentimento expresso e documentado do paciente, bem como compartilhar, publicar ou usar comercialmente qualquer conteúdo de atendimento.",
      "7.5. Incidentes de segurança envolvendo dados de pacientes devem ser comunicados à Plataforma em até 24 (vinte e quatro) horas do conhecimento do fato.",
    ],
  },
  {
    titulo: "8. Conduta, imagem e propriedade intelectual",
    itens: [
      "8.1. O Profissional autoriza a Plataforma a divulgar seu nome, foto, registro profissional, formação, abordagem, experiência e valores de sessão em canais próprios e em ações de divulgação, durante a vigência do cadastro.",
      "8.2. Marca, identidade visual, conteúdos, sistemas e bases de dados da Plataforma são de sua propriedade exclusiva, sendo vedado ao Profissional utilizá-los fora das finalidades deste contrato ou sugerir vínculo institucional que não exista.",
      "8.3. É vedado ao Profissional extrair, copiar, exportar ou utilizar a base de pacientes da Plataforma para fins próprios ou de terceiros.",
      "8.4. É vedada qualquer conduta discriminatória, assédio, exposição do paciente, promessa de cura, publicidade enganosa ou sensacionalista.",
    ],
  },
  {
    titulo: "9. Limitação de responsabilidade da Plataforma",
    itens: [
      "9.1. A Plataforma não responde por atos, omissões, erros técnicos, danos, resultados clínicos ou condutas do Profissional, nem por condutas do paciente.",
      "9.2. A Plataforma não garante funcionamento ininterrupto e não responde por falhas de internet, energia, equipamentos, provedores de videochamada ou de pagamento.",
      "9.3. Na máxima extensão permitida pela lei, eventual responsabilidade da Plataforma perante o Profissional fica limitada ao total das comissões efetivamente recebidas dele nos 3 (três) meses anteriores ao fato gerador.",
    ],
  },
  {
    titulo: "10. Vigência, rescisão e penalidades",
    itens: [
      "10.1. Este contrato vigora por prazo indeterminado a partir do aceite eletrônico.",
      "10.2. Qualquer parte pode encerrar a relação a qualquer tempo, mediante aviso de 15 (quinze) dias, cabendo ao Profissional honrar as consultas já confirmadas nesse período.",
      "10.3. A Plataforma pode rescindir imediatamente, sem aviso e sem qualquer indenização, em caso de infração à cláusula 3, falsidade documental, perda de habilitação profissional, violação de sigilo, risco ao paciente ou dano à reputação da Plataforma.",
      "10.4. As obrigações de sigilo, não desvio de pacientes, indenização e responsabilidade sobrevivem ao término deste contrato.",
    ],
  },
  {
    titulo: "11. Disposições finais",
    itens: [
      "11.1. A Plataforma pode alterar este contrato, notificando o Profissional; o uso contínuo ou a ausência de manifestação em 30 (trinta) dias implica aceite da nova versão, que poderá exigir nova assinatura eletrônica.",
      "11.2. A tolerância a qualquer descumprimento não implica renúncia de direitos. A nulidade de uma cláusula não afeta as demais.",
      "11.3. As partes reconhecem a validade da assinatura eletrônica deste termo (art. 10, §2º, da MP 2.200-2/2001), incluindo o registro de data, hora, endereço de rede e dispositivo do aceite como prova da manifestação de vontade.",
      "11.4. Aplica-se a lei brasileira, elegendo-se o foro da comarca da sede da Plataforma para dirimir controvérsias, com renúncia a qualquer outro.",
    ],
  },
];

export const DECLARACOES_ACEITE = [
  "Li e concordo integralmente com este contrato e com os termos de uso e a política de privacidade da Plataforma.",
  "Declaro que a responsabilidade pelos serviços de saúde que presto é exclusivamente minha e que a TOC Brazil apenas intermedia o contato entre mim e o paciente.",
  "Declaro estar ciente de que é proibido pedir contato particular do paciente ou atendê-lo fora da Plataforma, sob as penalidades da cláusula 3.",
];
