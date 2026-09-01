import { describe, expect, it } from "vitest";
import type { EggLogRead } from "../api/types";
import { aggregateEggCounts } from "./eggStats";

function makeLog(overrides: Partial<EggLogRead>): EggLogRead {
  return {
    id: "id",
    gecko_id: "gecko-id",
    date: "2026-08-01",
    egg_count: 1,
    note: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("aggregateEggCounts", () => {
  it("returns an empty array for no logs", () => {
    expect(aggregateEggCounts([])).toEqual([]);
  });

  it("sums multiple logs on the same date into one point", () => {
    const logs = [makeLog({ date: "2026-08-05", egg_count: 2 }), makeLog({ date: "2026-08-05", egg_count: 1 })];
    expect(aggregateEggCounts(logs)).toEqual([{ date: "2026-08-05", eggCount: 3 }]);
  });

  it("sorts distinct dates ascending regardless of input order", () => {
    const logs = [makeLog({ date: "2026-08-10", egg_count: 1 }), makeLog({ date: "2026-08-01", egg_count: 2 })];
    expect(aggregateEggCounts(logs)).toEqual([
      { date: "2026-08-01", eggCount: 2 },
      { date: "2026-08-10", eggCount: 1 },
    ]);
  });
});
