import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitOrder } from "../data/api";
import { upsertTodayOrder } from "./useOrders";

export default function useSubmitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitOrder,
    onSuccess: (result) => {
      // stol odmah zauzet u kešu, pa još i potvrda s backenda
      upsertTodayOrder(queryClient, result?.order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // backend je skinuo zalihu pića -> osvježi stanje (i neaktivne liste,
      // jer pića imaju staleTime: Infinity + refetchOnMount: false)
      queryClient.invalidateQueries({
        queryKey: ["menu", "drink"],
        refetchType: "all",
      });
    },
  });
}
