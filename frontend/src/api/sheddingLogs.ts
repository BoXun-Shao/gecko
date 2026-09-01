import { api } from "./client";
import type { SheddingLogCreate, SheddingLogRead, SheddingLogUpdate, SheddingPhotoRead } from "./types";

export function listSheddingLogs(geckoId: string) {
  return api.get<SheddingLogRead[]>(`/geckos/${geckoId}/shedding-logs`);
}

export function createSheddingLog(geckoId: string, body: SheddingLogCreate) {
  return api.post<SheddingLogRead>(`/geckos/${geckoId}/shedding-logs`, body);
}

export function updateSheddingLog(id: string, body: SheddingLogUpdate) {
  return api.patch<SheddingLogRead>(`/shedding-logs/${id}`, body);
}

export function deleteSheddingLog(id: string) {
  return api.del<void>(`/shedding-logs/${id}`);
}

export function uploadSheddingPhotos(logId: string, files: File[]) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  return api.post<SheddingPhotoRead[]>(`/shedding-logs/${logId}/photos`, form);
}

export function deleteSheddingPhoto(photoId: string) {
  return api.del<void>(`/shedding-photos/${photoId}`);
}
