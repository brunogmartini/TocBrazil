import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { container, destaque, main, paragrafo, rodape, titulo } from "./estilos";

interface Props {
  nomeProfissional?: string;
  registro?: string;
  uf?: string;
  cadastradoEm?: string;
}

const Email = ({
  nomeProfissional = "Novo profissional",
  registro = "Não informado",
  uf = "",
  cadastradoEm = "Agora",
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo cadastro profissional aguardando conferência.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={titulo}>Novo cadastro profissional</Heading>
        <Text style={paragrafo}>Um novo psicólogo iniciou o cadastro na TOC Brazil.</Text>
        <div style={destaque}>
          <Text style={paragrafo}>
            <strong>Nome:</strong> {nomeProfissional}
          </Text>
          <Text style={paragrafo}>
            <strong>CRP:</strong> {registro}{uf ? ` — ${uf}` : ""}
          </Text>
          <Text style={{ ...paragrafo, margin: 0 }}>
            <strong>Cadastro realizado em:</strong> {cadastradoEm}
          </Text>
        </div>
        <Text style={paragrafo}>Acesse o painel do gestor para acompanhar e conferir o cadastro.</Text>
        <Text style={rodape}>Mensagem automática da TOC Brazil.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Novo cadastro profissional na TOC Brazil",
  displayName: "Novo cadastro profissional",
  to: "contatotocbrazil@gmail.com",
  previewData: {
    nomeProfissional: "Dra. Marina Alves",
    registro: "06/123456",
    uf: "SP",
    cadastradoEm: "01/10/2026, 11:30",
  },
} satisfies TemplateEntry;