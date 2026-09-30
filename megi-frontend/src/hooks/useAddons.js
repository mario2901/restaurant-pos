import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api";

const useAddons = () => {
  async function fetchAddons() {
    const response = await fetch(`${API}/addons`);
    if (!response.ok) throw new Error("Greška pri učitavanju priloga");
    return response.json();
  }

  return useQuery({
    queryKey: ["menu", "addons"],
    queryFn: fetchAddons,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useAddons;
