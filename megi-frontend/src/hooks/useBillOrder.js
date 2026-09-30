import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billOrder } from "../data/api";

// "Račun": zatvara narudžbu i vraća račun (Ticket) za print
export default function useBillOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
