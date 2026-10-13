import { describe, expect, it } from "vitest";
import { signupLegalDocuments, signupDocumentsReady, legalDocumentReady, registrationConsentAllowed } from "./legal";
describe("explicit legal consent", () => {
  const documents = [
    { slug: "privacidade", content_md: "Política oficial integral para leitura e concordância explícita." },
    { slug: "termos-de-uso", content_md: "Termos oficiais integrais para leitura e concordância explícita." },
    { slug: "termos-profissionais", content_md: "[COLE AQUI O TEXTO]" },
  ];
  it("allows professional signup with official privacy only, never accepting pending terms", () => {
    expect(signupLegalDocuments(documents, "profissional").map(d => d.slug)).toEqual(["privacidade"]);
    expect(signupDocumentsReady(documents, "profissional")).toBe(true);
    expect(signupDocumentsReady(documents.filter(d => d.slug !== "privacidade"), "profissional")).toBe(false);
    expect(signupDocumentsReady([{ slug: "privacidade", content_md: "[COLE AQUI O TEXTO]" }], "profissional")).toBe(false);
  });
  it("preserves both official documents required for patient signup", () => {
    expect(signupLegalDocuments(documents, "paciente").map(d => d.slug)).toEqual(["privacidade", "termos-de-uso"]);
    expect(signupDocumentsReady(documents, "paciente")).toBe(true);
    expect(signupDocumentsReady(documents.filter(d => d.slug !== "termos-de-uso"), "paciente")).toBe(false);
  });
  it("requires both patient choices", () => {
    expect(registrationConsentAllowed(false, false, "paciente")).toBe(false);
    expect(registrationConsentAllowed(true, false, "paciente")).toBe(false);
    expect(registrationConsentAllowed(false, true, "paciente")).toBe(false);
    expect(registrationConsentAllowed(true, true, "paciente")).toBe(true);
  });
  it("requires professional agreement without patient sensitive consent", () => {
    expect(registrationConsentAllowed(false, false, "profissional")).toBe(false);
    expect(registrationConsentAllowed(true, false, "profissional")).toBe(true);
  });
  it("never permits placeholder documents for acceptance", () => {
    expect(legalDocumentReady("[COLE AQUI O TEXTO]".repeat(3))).toBe(false);
    expect(legalDocumentReady("Documento oficial integral com conteúdo válido para leitura e aceite.")).toBe(true);
  });
});