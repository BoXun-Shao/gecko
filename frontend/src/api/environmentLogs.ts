import { api } from "./client";
import type { EnvironmentLogCreate, EnvironmentLogRead, EnvironmentLogUpdate } from "./types";

export function listEnvironmentLogs(geckoId: string) {
  return api.get<EnvironmentLogRead[]>(`/geckos/${geckoId}/environment-logs`);
}

export function createEnvironmentLog(geckoId: string, body: EnvironmentLogCreate) {
  return api.post<EnvironmentLogRead>(`/geckos/${geckoId}/environment-logs`, body);
}

export function updateEnvironmentLog(id: string, body: EnvironmentLogUpdate) {
  return api.patch<EnvironmentLogRead>(`/environment-logs/${id}`, body);
}

export function deleteEnvironmentLog(id: string) {
  return api.del<void>(`/environment-logs/${id}`);
}
