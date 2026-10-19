import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBackup, getBackupStatus } from "../data/api";

const BACKUP_KEY = ["backup"];

export function useBackupStatus() {
  return useQuery({
    queryKey: BACKUP_KEY,
    queryFn: getBackupStatus,
    refetchInterval: 60_000,
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBackup,
    onSettled: () => queryClient.invalidateQueries({ queryKey: BACKUP_KEY }),
  });
}
