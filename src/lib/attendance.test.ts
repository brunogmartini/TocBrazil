import { describe, expect, it } from "vitest";
import { confirmationAvailable, missingRoomAlert, validMeetingUrl, LINK_RELEASE_MINUTES, LINK_EXPIRY_HOURS } from "./attendance";
const inicio = "2026-10-08T12:00:00Z";
const start = Date.parse(inicio);
describe("attendance rules", () => {
  it("confirmation opens at start, not before", () => { expect(confirmationAvailable(inicio, "confirmada", null, start - 1)).toBe(false); expect(confirmationAvailable(inicio, "confirmada", null, start)).toBe(true); });
  it("confirmation closes after 24 hours", () => { expect(confirmationAvailable(inicio, "confirmada", null, start + 24 * 3600_000)).toBe(true); expect(confirmationAvailable(inicio, "confirmada", null, start + 24 * 3600_000 + 1)).toBe(false); });
  it("existing confirmations cannot be repeated by the control", () => { expect(confirmationAvailable(inicio, "confirmada", inicio, start)).toBe(false); });
  it("missing link alert requires less than 24 hours", () => { expect(missingRoomAlert(inicio, false, start - 24 * 3600_000)).toBe(false); expect(missingRoomAlert(inicio, false, start - 24 * 3600_000 + 1)).toBe(true); expect(missingRoomAlert(inicio, true, start - 60000)).toBe(false); });
  it("accepts HTTPS only, without credentials", () => { expect(validMeetingUrl("https://meet.google.com/abc-defg-hij")).toBe(true); expect(validMeetingUrl("http://zoom.us/room")).toBe(false); expect(validMeetingUrl("https://user:pass@example.com")).toBe(false); expect(validMeetingUrl("not-a-url")).toBe(false); });
  it("release is 15 minutes and expiry is two hours", () => { expect(LINK_RELEASE_MINUTES).toBe(15); expect(LINK_EXPIRY_HOURS).toBe(2); });
});