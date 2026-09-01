import type { GeckoRead } from "../api/types";

export function hasConfiguredSafeRange(gecko: GeckoRead): boolean {
  return (
    (gecko.safe_temp_min != null && gecko.safe_temp_max != null) ||
    (gecko.safe_humidity_min != null && gecko.safe_humidity_max != null)
  );
}

export function isOutOfRange(value: number, min: number | null | undefined, max: number | null | undefined): boolean {
  if (min == null || max == null) return false;
  return value < min || value > max;
}
