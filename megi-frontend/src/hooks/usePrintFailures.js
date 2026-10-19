import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dismissFailedPrint,
  getFailedPrints,
  retryFailedPrint,
} from "../data/api";

export const PRINT_FAILED_KEY = ["print", "failed"];

/** Lista neisprintanih tiketa — provjera svakih 3 s (vidi se na svim uređajima). */
export function usePrintFailures() {
  return useQuery({
    queryKey: PRINT_FAILED_KEY,
    queryFn: getFailedPrints,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });
}

function useFailedMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // i kod greške: retry je ažurirao poruku / broj pokušaja na backendu
    onSettled: () => queryClient.invalidateQueries({ queryKey: PRINT_FAILED_KEY }),
  });
}

export const useRetryPrint = () => useFailedMutation(retryFailedPrint);
export const useDismissPrint = () => useFailedMutation(dismissFailedPrint);
