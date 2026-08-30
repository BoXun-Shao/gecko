import { describe, expect, it } from "vitest";
import type { DailyLogRead } from "../api/types";
import { computeFeedingBand, isDueDay, wasFed } from "./feedingBand";

function makeLog(overrides: Partial<DailyLogRead>): DailyLogRead {
  return {
    id: "id",
    gecko_id: "gecko-id",
    date: "2026-08-01",
    status: "fed",
    qty: 1,
    food: null,
    food_size: null,
    poop: false,
    weight: null,
    note: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("wasFed", () => {
  it("is true for fed/partial status with qty > 0", () => {
    expect(wasFed(makeLog({ status: "fed", qty: 3 }))).toBe(true);
    expect(wasFed(makeLog({ status: "partial", qty: 1 }))).toBe(true);
  });

  it("is false for fed status with qty 0 (edited-but-not-updated edge case)", () => {
    expect(wasFed(makeLog({ status: "fed", qty: 0 }))).toBe(false);
  });

  it("is false for refused/skipped regardless of qty", () => {
    expect(wasFed(makeLog({ status: "refused", qty: 0 }))).toBe(false);
    expect(wasFed(makeLog({ status: "skipped", qty: 0 }))).toBe(false);
  });
});

describe("isDueDay", () => {
  it("is due when there is no prior feeding at all", () => {
    expect(isDueDay([], 7, "2026-08-10")).toBe(true);
  });

  it("is not due when the interval has not elapsed since the last feeding", () => {
    const logs = [makeLog({ date: "2026-08-05", status: "fed", qty: 3 })];
    expect(isDueDay(logs, 7, "2026-08-08")).toBe(false);
  });

  it("is due once the interval has elapsed since the last feeding", () => {
    const logs = [makeLog({ date: "2026-08-01", status: "fed", qty: 3 })];
    expect(isDueDay(logs, 7, "2026-08-08")).toBe(true);
  });

  it("only considers feedings strictly before the target date", () => {
    const logs = [makeLog({ date: "2026-08-08", status: "fed", qty: 3 })];
    // 同一天的餵食不算「之前」的最後一次餵食，沒有更早的紀錄時視為 due
    expect(isDueDay(logs, 7, "2026-08-08")).toBe(true);
  });
});

describe("computeFeedingBand", () => {
  it("returns exactly 60 cells ending on `today`", () => {
    const cells = computeFeedingBand([], "2026-08-30", 7);
    expect(cells).toHaveLength(60);
    expect(cells[59].date).toBe("2026-08-30");
  });

  it("marks every day as off when there is no feeding history at all", () => {
    const cells = computeFeedingBand([], "2026-08-30", 7);
    expect(cells.every((c) => c.status === "off")).toBe(true);
  });

  it("classifies a fed day as 'fed' and carries it forward as the due-date baseline", () => {
    const logs = [makeLog({ date: "2026-08-01", status: "fed", qty: 3 })];
    const cells = computeFeedingBand(logs, "2026-08-10", 7);
    const fedCell = cells.find((c) => c.date === "2026-08-01")!;
    expect(fedCell.status).toBe("fed");

    // 08-08 是排定餵食日（08-01 + 7 天）但沒有紀錄 → due；08-08 之後幾天且仍未達下一輪才是 off
    const dueCell = cells.find((c) => c.date === "2026-08-08")!;
    expect(dueCell.status).toBe("due");
  });

  it("classifies an explicit refused-status day as 'refused'", () => {
    const logs = [makeLog({ date: "2026-08-05", status: "refused", qty: 0 })];
    const cells = computeFeedingBand(logs, "2026-08-10", 7);
    expect(cells.find((c) => c.date === "2026-08-05")!.status).toBe("refused");
  });

  it("classifies an explicit skipped-status day as 'skip'", () => {
    const logs = [makeLog({ date: "2026-08-05", status: "skipped", qty: 0 })];
    const cells = computeFeedingBand(logs, "2026-08-10", 7);
    expect(cells.find((c) => c.date === "2026-08-05")!.status).toBe("skip");
  });

  it("flags poop on the corresponding day regardless of feeding status", () => {
    const logs = [makeLog({ date: "2026-08-05", status: "fed", qty: 2, poop: true })];
    const cells = computeFeedingBand(logs, "2026-08-10", 7);
    expect(cells.find((c) => c.date === "2026-08-05")!.poop).toBe(true);
  });
});
