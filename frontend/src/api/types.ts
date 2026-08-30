import type { components } from "../openapi-types";

export type Gender = "male" | "female" | "unknown";
export type FeedingStatus = "fed" | "partial" | "refused" | "skipped";
export type EnvironmentSource = "manual" | "sensor";

export type GeckoRead = components["schemas"]["GeckoRead"];
export type GeckoCreate = components["schemas"]["GeckoCreate"];
export type GeckoUpdate = components["schemas"]["GeckoUpdate"];

export type DailyLogRead = components["schemas"]["DailyLogRead"];
export type DailyLogCreate = components["schemas"]["DailyLogCreate"];
export type DailyLogUpdate = components["schemas"]["DailyLogUpdate"];

export type SheddingLogRead = components["schemas"]["SheddingLogRead"];
export type SheddingLogCreate = components["schemas"]["SheddingLogCreate"];
export type SheddingLogUpdate = components["schemas"]["SheddingLogUpdate"];
export type SheddingPhotoRead = components["schemas"]["SheddingPhotoRead"];

export type EnvironmentLogRead = components["schemas"]["EnvironmentLogRead"];
export type EnvironmentLogCreate = components["schemas"]["EnvironmentLogCreate"];
export type EnvironmentLogUpdate = components["schemas"]["EnvironmentLogUpdate"];

export type EggLogRead = components["schemas"]["EggLogRead"];
export type EggLogCreate = components["schemas"]["EggLogCreate"];
export type EggLogUpdate = components["schemas"]["EggLogUpdate"];
