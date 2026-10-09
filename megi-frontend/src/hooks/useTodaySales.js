import { useQuery } from "@tanstack/react-query";
import { todayReport } from "../data/api";

// Današnji izvještaj (broji samo zatvorene narudžbe) — za "Moj promet danas".
export default function useTodaySales() {
  return useQuery({
    queryKey: ["reports", "today"],
    queryFn: todayReport,
    refetchInterval: 30000,
  });
}
