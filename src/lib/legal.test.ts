import { describe, expect, it } from "vitest";
import { legalDocumentReady, registrationConsentAllowed } from "./legal";
describe("explicit legal consent", () => {
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