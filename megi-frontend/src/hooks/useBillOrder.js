import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billOrder } from "../data/api";
import { upsertTodayOrder } from "./useOrders";

// "Račun": zatvara narudžbu, backend odmah printa račun na šanku.
// Vraća SendResult { order, tickets: [račun], printed, printError }.
export default function useBillOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billOrder,
    onSuccess: (result) => {
      // stol odmah slobodan u kešu (narudžba DONE), pa potvrda s backenda
      upsertTodayOrder(queryClient, result?.order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
