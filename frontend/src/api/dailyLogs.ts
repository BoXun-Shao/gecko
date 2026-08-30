import { api } from "./client";
import type { DailyLogCreate, DailyLogRead, DailyLogUpdate } from "./types";

export function listDailyLogs(geckoId: string) {
  return api.get<DailyLogRead[]>(`/geckos/${geckoId}/daily-logs`);
}

export function createDailyLog(geckoId: string, body: DailyLogCreate) {
  return api.post<DailyLogRead>(`/geckos/${geckoId}/daily-logs`, body);
}

export function updateDailyLog(id: string, body: DailyLogUpdate) {
  return api.patch<DailyLogRead>(`/daily-logs/${id}`, body);
}

export function deleteDailyLog(id: string) {
  return api.del<void>(`/daily-logs/${id}`);
}
