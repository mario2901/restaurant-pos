import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billOrder } from "../data/api";

// "Račun": zatvara narudžbu, backend odmah printa račun na šanku.
// Vraća SendResult { order, tickets: [račun], printed, printError }.
export default function useBillOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
