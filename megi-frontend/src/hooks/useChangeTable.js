import { useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeOrderTable } from "../data/api";
import { OrderContext } from "../context/OrderContext";

// Stol -> stol ili za ponijeti -> stol.
// Sa "za ponijeti" backend vraća reprint za kuhinju (ne pakirati); inače je lista tiketa prazna.
export default function useChangeTable() {
  const queryClient = useQueryClient();
  const { retargetTable, showTickets } = useContext(OrderContext);

  return useMutation({
    mutationFn: ({ orderId, table }) => changeOrderTable(orderId, table),
    onSuccess: (result, { orderId, table }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      retargetTable(orderId, table);
      showTickets(result?.tickets);
    },
  });
}
