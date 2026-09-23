import { useQuery } from "@tanstack/react-query";
import { getActiveOrders } from "../data/api";
export default function useActiveOrders() {
  const query = useQuery({
    queryKey: ["orders", "active"],
    queryFn: getActiveOrders,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const byTable = {};

  for (const order of query.data ?? []) {
    const key = String(order.table);
    (byTable[key] ??= []).push(order);
  }
  return { ...query, byTable };
}
