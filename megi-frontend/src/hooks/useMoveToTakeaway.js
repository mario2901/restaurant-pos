import { useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveOrderToTakeaway } from "../data/api";
import { OrderContext } from "../context/OrderContext";

// Stol -> za ponijeti: backend vraća reprint kuhinjskog tiketa s oznakom
export default function useMoveToTakeaway() {
  const queryClient = useQueryClient();
  const { showTickets, retargetTable } = useContext(OrderContext);

  return useMutation({
    mutationFn: ({ orderId, note }) => moveOrderToTakeaway(orderId, note),
    onSuccess: (result, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      retargetTable(orderId, "PONIJETI");
      showTickets(result);
    },
  });
}
