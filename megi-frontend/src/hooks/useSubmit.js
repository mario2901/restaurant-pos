import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitOrder } from "../data/api";

export default function useSubmitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitOrder,
    onSuccess: () => {
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
