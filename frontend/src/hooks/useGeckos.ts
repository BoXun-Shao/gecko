import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as geckosApi from "../api/geckos";
import type { GeckoCreate, GeckoUpdate } from "../api/types";

const GECKOS_KEY = ["geckos"] as const;

export function useGeckos() {
  return useQuery({ queryKey: GECKOS_KEY, queryFn: geckosApi.listGeckos });
}

export function useCreateGecko() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GeckoCreate) => geckosApi.createGecko(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GECKOS_KEY }),
  });
}

export function useUpdateGecko() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GeckoUpdate }) => geckosApi.updateGecko(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GECKOS_KEY }),
  });
}

export function useDeleteGecko() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => geckosApi.deleteGecko(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GECKOS_KEY }),
  });
}

export function useUploadGeckoPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => geckosApi.uploadGeckoPhoto(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GECKOS_KEY }),
  });
}
