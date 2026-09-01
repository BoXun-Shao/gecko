import { describe, expect, it } from "vitest";
import type { GeckoRead } from "../api/types";
import { hasConfiguredSafeRange, isOutOfRange } from "./environment";

function makeGecko(overrides: Partial<GeckoRead>): GeckoRead {
  return {
    id: "gecko-id",
    name: "測試守宮",
    morph: null,
    gender: "unknown",
    birth_date: null,
    acquired_date: null,
    photo_path: null,
    feeding_interval_days: 7,
    note: null,
    safe_temp_min: null,
    safe_temp_max: null,
    safe_humidity_min: null,
    safe_humidity_max: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("hasConfiguredSafeRange", () => {
  it("is false when all four bounds are unset", () => {
    expect(hasConfiguredSafeRange(makeGecko({}))).toBe(false);
  });

  it("is false when only one bound of a metric is set (range not usable for out-of-range checks)", () => {
    expect(hasConfiguredSafeRange(makeGecko({ safe_temp_min: 24 }))).toBe(false);
  });

  it("is true when at least one metric has both bounds set", () => {
    expect(hasConfiguredSafeRange(makeGecko({ safe_temp_min: 24, safe_temp_max: 32 }))).toBe(true);
    expect(hasConfiguredSafeRange(makeGecko({ safe_humidity_min: 40, safe_humidity_max: 70 }))).toBe(true);
  });
});

describe("isOutOfRange", () => {
  it("is false when either bound is missing (range not configured for this metric)", () => {
    expect(isOutOfRange(50, null, 30)).toBe(false);
    expect(isOutOfRange(50, 20, null)).toBe(false);
    expect(isOutOfRange(50, null, null)).toBe(false);
  });

  it("is false when the value is within [min, max]", () => {
    expect(isOutOfRange(25, 20, 30)).toBe(false);
    expect(isOutOfRange(20, 20, 30)).toBe(false);
    expect(isOutOfRange(30, 20, 30)).toBe(false);
  });

  it("is true when the value falls below min or above max", () => {
    expect(isOutOfRange(19.9, 20, 30)).toBe(true);
    expect(isOutOfRange(30.1, 20, 30)).toBe(true);
  });
});
