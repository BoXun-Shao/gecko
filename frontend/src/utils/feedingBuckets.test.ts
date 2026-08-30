import { describe, expect, it } from "vitest";
import type { DailyLogRead } from "../api/types";
import { buildBuckets, fillBuckets } from "./feedingBuckets";

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

describe("buildBuckets", () => {
  it("day mode returns 30 single-day buckets ending on today", () => {
    const buckets = buildBuckets("day", "2026-08-30", 7);
    expect(buckets).toHaveLength(30);
    expect(buckets[29].start).toBe("2026-08-30");
    expect(buckets[29].end).toBe("2026-08-30");
  });

  it("week mode returns 12 week-long buckets aligned to Monday", () => {
    const buckets = buildBuckets("week", "2026-08-30", 7);
    expect(buckets).toHaveLength(12);
    const last = buckets[buckets.length - 1];
    const spanDays = (new Date(last.end).getTime() - new Date(last.start).getTime()) / 86400000;
    expect(spanDays).toBe(6);
  });

  it("cycle mode buckets span the gecko's own feeding interval", () => {
    const buckets = buildBuckets("cycle", "2026-08-30", 5);
    expect(buckets).toHaveLength(12);
    const last = buckets[buckets.length - 1];
    const spanDays = (new Date(last.end).getTime() - new Date(last.start).getTime()) / 86400000;
    expect(spanDays).toBe(4); // 5 天週期含頭尾 = 4 天差
  });

  it("year mode returns 6 full-year buckets", () => {
    const buckets = buildBuckets("year", "2026-08-30", 7);
    expect(buckets).toHaveLength(6);
    expect(buckets[buckets.length - 1].label).toBe("2026");
  });
});

describe("fillBuckets", () => {
  it("sums qty and classifies each log into fed/refused/skip counts", () => {
    const buckets = buildBuckets("day", "2026-08-05", 7);
    const logs = [
      makeLog({ date: "2026-08-05", status: "fed", qty: 3 }),
      makeLog({ date: "2026-08-04", status: "refused", qty: 0 }),
      makeLog({ date: "2026-08-03", status: "skipped", qty: 0 }),
    ];
    const filled = fillBuckets(buckets, logs);

    const fedBucket = filled.find((b) => b.start === "2026-08-05")!;
    expect(fedBucket.qty).toBe(3);
    expect(fedBucket.fed).toBe(1);

    const refusedBucket = filled.find((b) => b.start === "2026-08-04")!;
    expect(refusedBucket.refused).toBe(1);
    expect(refusedBucket.qty).toBe(0);

    const skippedBucket = filled.find((b) => b.start === "2026-08-03")!;
    expect(skippedBucket.skip).toBe(1);
  });

  it("counts poop separately from feeding status", () => {
    const buckets = buildBuckets("day", "2026-08-05", 7);
    const logs = [makeLog({ date: "2026-08-05", status: "fed", qty: 2, poop: true })];
    const filled = fillBuckets(buckets, logs);
    expect(filled.find((b) => b.start === "2026-08-05")!.poop).toBe(1);
  });

  it("ignores logs outside the bucket range", () => {
    const buckets = buildBuckets("day", "2026-08-05", 7);
    const logs = [makeLog({ date: "2020-01-01", status: "fed", qty: 5 })];
    const filled = fillBuckets(buckets, logs);
    expect(filled.every((b) => b.qty === 0)).toBe(true);
  });
});
