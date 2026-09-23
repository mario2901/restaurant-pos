import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api";

const useOrders = () => {
  async function fetchOrders() {
    const res = await fetch(`${API}/orders`);
    if (!res.ok) throw new Error("Greška prilikom učitavanja narudzbi");
    return res.json();
  }

  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });
};

export default useOrders;
