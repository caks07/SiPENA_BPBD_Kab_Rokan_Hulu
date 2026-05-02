import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLaporan, patchSeverity } from "../api/laporan";

export const useLaporan = (params?: Record<string, string | number>) =>
  useQuery({
    queryKey: ["laporan", params],
    queryFn: () => getLaporan(params),
  });

export const usePatchSeverity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, severity }: { id: number; severity: number }) => patchSeverity(id, severity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["laporan"] }),
  });
};
