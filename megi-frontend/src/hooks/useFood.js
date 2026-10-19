import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api.js";

/**
 * Jela s porcijama i opcijama.
 *  - useFood()              -> konobarski meni, samo dostupna  (key ["food"])
 *  - useFood({ all: true }) -> Admin, i skinuta s menija       (key ["food", "all"])
 * Invalidacija ["food"] osvježava oba.
 */
const useFood = ({ all = false } = {}) => {
  async function fetchFood() {
    const response = await fetch(`${API}/food?onlyAvailable=${!all}`);
    if (!response.ok) throw new Error("Greška pri učitavanju jela.");
    return response.json();
  }

  return useQuery({
    queryKey: all ? ["food", "all"] : ["food"],
    queryFn: fetchFood,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useFood;
