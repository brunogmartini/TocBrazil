import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { AVISO_URGENCIA, container, destaque, main, paragrafo, rodape, titulo } from "./estilos";

interface Props {
  nomePaciente?: string;
  nomeProfissional?: string;
  quando?: string;
  duracaoMinutos?: number;
  valor?: string;
  antecedenciaLinkMinutos?: number;
}

const Email = ({
  nomePaciente,
  nomeProfissional = "seu profissional",
  quando = "",
  duracaoMinutos = 50,
  valor,
  antecedenciaLinkMinutos = 15,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Sua consulta está confirmada{quando ? ` para ${quando}` : ""}.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={titulo}>Consulta confirmada</Heading>
        <Text style={paragrafo}>
          {nomePaciente ? `Olá, ${nomePaciente}.` : "Olá."} Recebemos a confirmação do seu
          agendamento.
        </Text>
        <Section style={destaque}>
          <Text style={paragrafo}>
            <strong>Profissional:</strong> {nomeProfissional}
          </Text>
          {quando ? (
            <Text style={paragrafo}>
              <strong>Data e horário:</strong> {quando} (horário de Brasília)
            </Text>
          ) : null}
          <Text style={paragrafo}>
            <strong>Duração:</strong> {duracaoMinutos} minutos
          </Text>
          {valor ? (
            <Text style={{ ...paragrafo, margin: 0 }}>
              <strong>Valor:</strong> {valor}
            </Text>
          ) : null}
        </Section>
        <Text style={paragrafo}>
          O endereço da sala de videochamada fica disponível na sua área da TOC Brazil a partir de{" "}
          {antecedenciaLinkMinutos} minutos antes do horário marcado, junto com as instruções do
          profissional.
        </Text>
        <Text style={paragrafo}>
          A consulta acontece na ferramenta de videochamada mantida pelo próprio profissional. A TOC
          Brazil é uma empresa de tecnologia e apenas intermedeia o agendamento.
        </Text>
        <Text style={rodape}>{AVISO_URGENCIA}</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Sua consulta está confirmada — TOC Brazil",
  displayName: "Consulta confirmada",
  previewData: {
    nomePaciente: "Ana",
    nomeProfissional: "Dra. Marina Alves",
    quando: "22/09/2026 às 15:00",
    duracaoMinutos: 50,
    valor: "R$ 220,00",
    antecedenciaLinkMinutos: 15,
  },
} satisfies TemplateEntry;
