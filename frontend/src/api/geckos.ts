import { api } from "./client";
import type { GeckoCreate, GeckoRead, GeckoUpdate } from "./types";

export function listGeckos() {
  return api.get<GeckoRead[]>("/geckos");
}

export function getGecko(id: string) {
  return api.get<GeckoRead>(`/geckos/${id}`);
}

export function createGecko(body: GeckoCreate) {
  return api.post<GeckoRead>("/geckos", body);
}

export function updateGecko(id: string, body: GeckoUpdate) {
  return api.patch<GeckoRead>(`/geckos/${id}`, body);
}

export function deleteGecko(id: string) {
  return api.del<void>(`/geckos/${id}`);
}

export async function uploadGeckoPhoto(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/geckos/${id}/photo`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error(`上傳照片失敗（${res.status}）`);
  return (await res.json()) as GeckoRead;
}
