import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as sheddingLogsApi from "../api/sheddingLogs";
import type { SheddingLogCreate, SheddingLogUpdate } from "../api/types";

const sheddingLogsKey = (geckoId: string) => ["shedding-logs", geckoId] as const;

export function useSheddingLogs(geckoId: string) {
  return useQuery({ queryKey: sheddingLogsKey(geckoId), queryFn: () => sheddingLogsApi.listSheddingLogs(geckoId) });
}

export function useCreateSheddingLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SheddingLogCreate) => sheddingLogsApi.createSheddingLog(geckoId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sheddingLogsKey(geckoId) }),
  });
}

export function useUpdateSheddingLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SheddingLogUpdate }) => sheddingLogsApi.updateSheddingLog(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sheddingLogsKey(geckoId) }),
  });
}

export function useDeleteSheddingLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sheddingLogsApi.deleteSheddingLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sheddingLogsKey(geckoId) }),
  });
}

export function useUploadSheddingPhotos(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ logId, files }: { logId: string; files: File[] }) => sheddingLogsApi.uploadSheddingPhotos(logId, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sheddingLogsKey(geckoId) }),
  });
}

export function useDeleteSheddingPhoto(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => sheddingLogsApi.deleteSheddingPhoto(photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sheddingLogsKey(geckoId) }),
  });
}
