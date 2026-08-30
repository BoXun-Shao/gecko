import { describe, expect, it } from "vitest";
import { daysBetween, toDate, toDateStr, todayStr } from "./dates";

describe("toDateStr", () => {
  it("formats a Date as YYYY-MM-DD with zero-padding", () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateStr(new Date(2026, 10, 30))).toBe("2026-11-30");
  });
});

describe("toDate", () => {
  it("parses a YYYY-MM-DD string as local midnight", () => {
    const d = toDate("2026-08-30");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(30);
    expect(d.getHours()).toBe(0);
  });
});

describe("daysBetween", () => {
  it("returns positive days when target is after from", () => {
    expect(daysBetween("2026-08-01", "2026-08-10")).toBe(9);
  });

  it("returns negative days when target is before from", () => {
    expect(daysBetween("2026-08-10", "2026-08-01")).toBe(-9);
  });

  it("returns 0 for the same date", () => {
    expect(daysBetween("2026-08-01", "2026-08-01")).toBe(0);
  });
});

describe("todayStr", () => {
  it("matches toDateStr(new Date())", () => {
    expect(todayStr()).toBe(toDateStr(new Date()));
  });
});
