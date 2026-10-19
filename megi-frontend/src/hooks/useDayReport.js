import { useQuery } from "@tanstack/react-query";
import { getDayReport, getDeliveryDayReport } from "../data/api";

/**
 * Izvještaj za odabrani dan.
 *  type "promet"  -> GET /reports/day?date=          (SalesReport)
 *  type "dostava" -> GET /reports/delivery/day?date= (DeliveryReport)
 * Današnji dan se mijenja tijekom rada, pa podaci nisu trajno svježi (staleTime 30 s).
 */
export default function useDayReport(date, type = "promet") {
  return useQuery({
    queryKey: ["reports", type, date],
    queryFn: () =>
      type === "dostava" ? getDeliveryDayReport(date) : getDayReport(date),
    enabled: !!date,
    staleTime: 30_000,
  });
}
