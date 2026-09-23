import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitOrder } from "../data/api";

export default function useSubmitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
