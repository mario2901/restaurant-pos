import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api";

/**
 *  - useDrink()              -> konobar / zalihe, samo dostupna  (key ["menu","drink"])
 *  - useDrink({ all: true }) -> Admin, i skinuta s karte          (key ["menu","drink","all"])
 */
const useDrink = ({ all = false } = {}) => {
  async function fetchDrink() {
    const response = await fetch(`${API}/drinks?onlyAvailable=${!all}`);
    if (!response.ok) throw new Error("Greška pri učitavanju pića.");
    return response.json();
  }

  return useQuery({
    queryKey: all ? ["menu", "drink", "all"] : ["menu", "drink"],
    queryFn: fetchDrink,

    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useDrink;
