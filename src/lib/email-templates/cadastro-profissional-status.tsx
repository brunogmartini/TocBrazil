import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { container, main, paragrafo, rodape, titulo } from "./estilos";

type Props = { nome?: string; situacao?: "recebido" | "aprovado" | "rejeitado" | "suspenso"; motivo?: string };
const mensagens = {
  recebido: "Recebemos seu cadastro profissional. Ele está em análise e ainda não aparece na busca.",
  aprovado: "Seu cadastro foi aprovado. A publicação do perfil depende das demais etapas de contrato, recebimento e agenda.",
  rejeitado: "Seu cadastro precisa de correção. Acesse sua área para ajustar os dados e reenviar.",
  suspenso: "Seu cadastro profissional foi suspenso. Acesse sua área para conferir a situação.",
};
const Email = ({ nome = "Profissional", situacao = "recebido", motivo }: Props) => (
  <Html lang="pt-BR"><Head /><Preview>Atualização do cadastro profissional — TOC Brazil</Preview><Body style={main}>
    <Container style={container}><Heading style={titulo}>Cadastro profissional</Heading>
      <Text style={paragrafo}>Olá, {nome}.</Text><Text style={paragrafo}>{mensagens[situacao]}</Text>
      {situacao === "rejeitado" && motivo ? <Text style={paragrafo}>Motivo: {motivo}</Text> : null}
      <Text style={rodape}>Mensagem automática da TOC Brazil.</Text>
    </Container>
  </Body></Html>
);
export const template = { component: Email, subject: "Situação do cadastro profissional — TOC Brazil", displayName: "Situação do cadastro profissional" } satisfies TemplateEntry;