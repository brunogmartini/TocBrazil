import { expect, it } from "vitest";
import { attendanceOutcome } from "./settlement";
it("system completion is financial evidence without inventing patient confirmation", () => {
  const a = { attendance_status: "realizada", professional_confirmed_at: "2026-11-13T12:00:00Z", patient_confirmed_at: null, attendance_decided_at: null, attendance_auto_completed_at: "2026-11-15T12:00:00Z", fim: "2026-11-13T12:00:00Z" };
  expect(attendanceOutcome(a, Date.parse("2026-11-15T12:00:00Z"))).toBe("REALIZADA");
  expect(attendanceOutcome({ ...a, professional_confirmed_at: null }, Date.parse("2026-11-15T12:00:00Z"))).toBe(null);
});