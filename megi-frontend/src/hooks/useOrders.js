import { useQuery } from "@tanstack/react-query";
import { getTodayOrders } from "../data/api";

// Narudžbe trenutnog radnog dana (backend sam određuje dan po satu servera).
const useOrders = () =>
  useQuery({
    queryKey: ["orders", "today"],
    queryFn: getTodayOrders,
    refetchInterval: 10000, // da se vide i narudžbe drugih konobara
    refetchOnWindowFocus: true,
  });

export default useOrders;
