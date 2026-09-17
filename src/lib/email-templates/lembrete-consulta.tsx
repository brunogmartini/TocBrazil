import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { AVISO_URGENCIA, container, destaque, main, paragrafo, rodape, titulo } from "./estilos";

interface Props {
  nomePaciente?: string;
  nomeProfissional?: string;
  quando?: string;
  emBreve?: boolean;
}

const Email = ({
  nomePaciente,
  nomeProfissional = "seu profissional",
  quando = "",
  emBreve = false,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      {emBreve ? "Sua consulta começa em poucos minutos." : "Sua consulta é amanhã."}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={titulo}>{emBreve ? "Sua consulta começa em breve" : "Lembrete da sua consulta"}</Heading>
        <Text style={paragrafo}>
          {nomePaciente ? `Olá, ${nomePaciente}.` : "Olá."}{" "}
          {emBreve
            ? "Sua consulta começa em poucos minutos."
            : "Este é um lembrete do seu horário marcado."}
        </Text>
        <div style={destaque}>
          <Text style={paragrafo}>
            <strong>Profissional:</strong> {nomeProfissional}
          </Text>
          {quando ? (
            <Text style={{ ...paragrafo, margin: 0 }}>
              <strong>Data e horário:</strong> {quando} (horário de Brasília)
            </Text>
          ) : null}
        </div>
        <Text style={paragrafo}>
          Entre na sua área da TOC Brazil para ver o endereço da sala de videochamada e as instruções
          do profissional.
        </Text>
        <Text style={rodape}>{AVISO_URGENCIA}</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    data["emBreve"] ? "Sua consulta começa em 15 minutos" : "Lembrete: sua consulta é amanhã",
  displayName: "Lembrete de consulta",
  previewData: {
    nomePaciente: "Ana",
    nomeProfissional: "Dra. Marina Alves",
    quando: "22/09/2026 às 15:00",
    emBreve: false,
  },
} satisfies TemplateEntry;
