import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as environmentLogsApi from "../api/environmentLogs";
import type { EnvironmentLogCreate, EnvironmentLogUpdate } from "../api/types";

const environmentLogsKey = (geckoId: string) => ["environment-logs", geckoId] as const;

export function useEnvironmentLogs(geckoId: string) {
  return useQuery({
    queryKey: environmentLogsKey(geckoId),
    queryFn: () => environmentLogsApi.listEnvironmentLogs(geckoId),
  });
}

export function useCreateEnvironmentLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnvironmentLogCreate) => environmentLogsApi.createEnvironmentLog(geckoId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: environmentLogsKey(geckoId) }),
  });
}

export function useUpdateEnvironmentLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EnvironmentLogUpdate }) =>
      environmentLogsApi.updateEnvironmentLog(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: environmentLogsKey(geckoId) }),
  });
}

export function useDeleteEnvironmentLog(geckoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => environmentLogsApi.deleteEnvironmentLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: environmentLogsKey(geckoId) }),
  });
}
