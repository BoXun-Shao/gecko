import { api } from "./client";
import type { EggLogCreate, EggLogRead, EggLogUpdate } from "./types";

export function listEggLogs(geckoId: string) {
  return api.get<EggLogRead[]>(`/geckos/${geckoId}/egg-logs`);
}

export function createEggLog(geckoId: string, body: EggLogCreate) {
  return api.post<EggLogRead>(`/geckos/${geckoId}/egg-logs`, body);
}

export function updateEggLog(id: string, body: EggLogUpdate) {
  return api.patch<EggLogRead>(`/egg-logs/${id}`, body);
}

export function deleteEggLog(id: string) {
  return api.del<void>(`/egg-logs/${id}`);
}
