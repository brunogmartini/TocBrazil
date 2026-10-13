export const SENSITIVE_CONSENT = "Consinto, de forma específica, com o tratamento dos meus dados pessoais, que podem revelar informação sobre minha saúde por eu usar uma plataforma voltada ao atendimento de TOC, para as finalidades descritas na Política de Privacidade.";
export type LegalSlug = "termos-de-uso" | "termos-profissionais" | "privacidade";
export function signupLegalDocuments<T extends { slug: string }>(documents: T[], area: string): T[] {
  return documents.filter(d => d.slug === "privacidade" || (area !== "profissional" && d.slug === "termos-de-uso"));
}
export function signupDocumentsReady(documents: { slug: string; content_md: string }[], area: string) {
  const selected = signupLegalDocuments(documents, area);
  return selected.length === (area === "profissional" ? 1 : 2) && selected.every(d => legalDocumentReady(d.content_md));
}
export function legalDocumentReady(content: string) { return content.trim().length >= 30 && !content.includes("[COLE AQUI O TEXTO]"); }
export function registrationConsentAllowed(terms: boolean, sensitive: boolean, area: string) { return terms && (area !== "paciente" || sensitive); }
export function legalSectionId(text: string) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }