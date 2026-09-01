import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as eggLogsApi from "../api/eggLogs";
import type { EggLogCreate, EggLogUpdate } from "../api/types";

const eggLogsKey = (geckoId: string) => ["egg-logs", geckoId] as const;

export function useEggLogs(geckoId: string) {
  return useQuery({ queryKey: eggLogsKey(geckoId), queryFn: () => eggLogsApi.listEggLogs(geckoId) });
}

export function useCreateEggLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EggLogCreate) => eggLogsApi.createEggLog(geckoId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eggLogsKey(geckoId) }),
  });
}

export function useUpdateEggLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EggLogUpdate }) => eggLogsApi.updateEggLog(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eggLogsKey(geckoId) }),
  });
}

export function useDeleteEggLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eggLogsApi.deleteEggLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eggLogsKey(geckoId) }),
  });
}
