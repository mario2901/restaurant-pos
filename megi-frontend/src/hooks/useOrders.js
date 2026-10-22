import { useQuery } from "@tanstack/react-query";
import { getTodayOrders } from "../data/api";

export const TODAY_ORDERS_KEY = ["orders", "today"];

/**
 * Narudžbe trenutnog radnog dana (backend sam određuje dan po satu servera).
 *
 * Isti uređaj: svaka akcija (Naruči, Račun, storno...) odmah osvježi listu.
 * Drugi uređaji (mobiteli konobara, laptop): provjera svake 3 s, pa nova
 * narudžba / zauzet stol stigne za najviše ~3 s. Na lokalnoj mreži to je
 * mali zahtjev; kad je tab u pozadini, ne pita se (štedi bateriju mobitela),
 * a pri povratku u aplikaciju osvježi se odmah.
 */
const useOrders = () =>
  useQuery({
    queryKey: TODAY_ORDERS_KEY,
    queryFn: getTodayOrders,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

export default useOrders;

/**
 * Odmah upiše narudžbu iz odgovora backenda u keš (bez čekanja na novi dohvat),
 * pa je stol zauzet / ažuriran u istom trenu kad se konobar vrati na stolove.
 */
export function upsertTodayOrder(queryClient, order) {
  if (!order?.id) return;
  queryClient.setQueryData(TODAY_ORDERS_KEY, (list) => {
    if (!Array.isArray(list)) return list;
    const i = list.findIndex((o) => o.id === order.id);
    if (i === -1) return [order, ...list];
    const next = list.slice();
    next[i] = order;
    return next;
  });
}
