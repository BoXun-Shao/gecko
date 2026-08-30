import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as dailyLogsApi from "../api/dailyLogs";
import type { DailyLogCreate, DailyLogUpdate } from "../api/types";

const dailyLogsKey = (geckoId: string) => ["daily-logs", geckoId] as const;

export function useDailyLogs(geckoId: string) {
  return useQuery({ queryKey: dailyLogsKey(geckoId), queryFn: () => dailyLogsApi.listDailyLogs(geckoId) });
}

export function useCreateDailyLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DailyLogCreate) => dailyLogsApi.createDailyLog(geckoId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dailyLogsKey(geckoId) }),
  });
}

export function useUpdateDailyLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DailyLogUpdate }) => dailyLogsApi.updateDailyLog(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dailyLogsKey(geckoId) }),
  });
}

export function useDeleteDailyLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyLogsApi.deleteDailyLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dailyLogsKey(geckoId) }),
  });
}
