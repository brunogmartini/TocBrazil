import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { AVISO_URGENCIA, container, destaque, main, paragrafo, rodape, titulo } from "./estilos";

interface Props {
  nomeProfissional?: string;
  documento?: string;
  validade?: string;
  diasRestantes?: number;
}

const Email = ({
  nomeProfissional,
  documento = "documento",
  validade = "",
  diasRestantes = 30,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Seu ${documento} vence em ${diasRestantes} dias.`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={titulo}>Documento perto do vencimento</Heading>
        <Text style={paragrafo}>
          {nomeProfissional ? `Olá, ${nomeProfissional}.` : "Olá."} Um documento do seu cadastro está
          perto de vencer.
        </Text>
        <div style={destaque}>
          <Text style={paragrafo}>
            <strong>Documento:</strong> {documento}
          </Text>
          {validade ? (
            <Text style={paragrafo}>
              <strong>Válido até:</strong> {validade}
            </Text>
          ) : null}
          <Text style={{ ...paragrafo, margin: 0 }}>
            <strong>Prazo:</strong> {diasRestantes} dias
          </Text>
        </div>
        <Text style={paragrafo}>
          Envie o documento atualizado na sua área do profissional. Enquanto ele estiver vencido, seu
          perfil fica fora da busca pública.
        </Text>
        <Text style={rodape}>{AVISO_URGENCIA}</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    `Seu ${String(data["documento"] ?? "documento")} vence em ${Number(data["diasRestantes"] ?? 30)} dias`,
  displayName: "Documento perto do vencimento",
  previewData: {
    nomeProfissional: "Dra. Marina Alves",
    documento: "certidão de regularidade do conselho",
    validade: "10/10/2026",
    diasRestantes: 30,
  },
} satisfies TemplateEntry;
