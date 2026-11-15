import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text, Link } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { AVISO_URGENCIA, container, main, paragrafo, rodape, titulo } from "./estilos";

const Email = ({ nomeProfissional, quando = "" }: { nomeProfissional?: string; quando?: string }) => (
  <Html lang="pt-BR" dir="ltr"><Head /><Preview>Pagamento aprovado: consulta confirmada para {quando}.</Preview>
    <Body style={main}><Container style={container}>
      <Heading style={titulo}>TOC Brazil — Consulta confirmada</Heading>
      <Text style={paragrafo}>{nomeProfissional ? `Olá, ${nomeProfissional}.` : "Olá."} O pagamento do paciente foi aprovado e a consulta está confirmada.</Text>
      <Text style={paragrafo}><strong>Data e horário:</strong> {quando} (horário de Brasília)</Text>
      <Text style={paragrafo}>Confira a consulta na <Link href="https://tocbrazil.com.br/profissional/agenda">sua agenda</Link> e informe o link exclusivo da sala, se ainda não o cadastrou.</Text>
      <Text style={paragrafo}>O paciente poderá acessar o link 30 minutos antes; o atendimento começa somente no horário marcado.</Text>
      <Text style={rodape}>{AVISO_URGENCIA}</Text>
    </Container></Body>
  </Html>
);
export const template = { component: Email, subject: "Pagamento aprovado: consulta confirmada — TOC Brazil", displayName: "Consulta confirmada para o psicólogo", previewData: { nomeProfissional: "Marina", quando: "20/11/2026, 15:00" } } satisfies TemplateEntry;