import { useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stornoItem, stornoItems, stornoOrder } from "../data/api";
import { OrderContext } from "../context/OrderContext";

/**
 * Storno stavke ili narudžbe (FOOD / DRINK / ALL).
 * Nakon uspjeha osvježi narudžbe i otvori STORNO tikete za print.
 *
 * mutate({ kind: "item", orderId, itemId, quantity })   quantity undefined = sve
 * mutate({ kind: "items", orderId, items: [{ itemId, quantity }] })
 * mutate({ kind: "order", orderId, scope })             scope: FOOD | DRINK | ALL
 */
export default function useStorno() {
  const queryClient = useQueryClient();
  const { showTickets } = useContext(OrderContext);

  return useMutation({
    mutationFn: (req) => {
      if (req.kind === "item")
        return stornoItem(req.orderId, req.itemId, req.quantity);
      if (req.kind === "items") return stornoItems(req.orderId, req.items);
      return stornoOrder(req.orderId, req.scope);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showTickets(result?.tickets);
    },
  });
}
