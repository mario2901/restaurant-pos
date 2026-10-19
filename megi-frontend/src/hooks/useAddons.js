import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api";

/**
 *  - useAddons()              -> konobar, samo dostupni prilozi  (key ["menu","addons"])
 *  - useAddons({ all: true }) -> Admin, i skinuti s ponude       (key ["menu","addons","all"])
 */
const useAddons = ({ all = false } = {}) => {
  async function fetchAddons() {
    const response = await fetch(`${API}/addons?onlyAvailable=${!all}`);
    if (!response.ok) throw new Error("Greška pri učitavanju priloga");
    return response.json();
  }

  return useQuery({
    queryKey: all ? ["menu", "addons", "all"] : ["menu", "addons"],
    queryFn: fetchAddons,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useAddons;
