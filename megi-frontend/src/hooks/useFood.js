import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api.js";

const useFood = () => {
  async function fetchFood() {
    const response = await fetch(`${API}/food?onlyAvailable=true`);
    if (!response.ok) throw new Error("Greška pri učitavanju jela.");
    return response.json();
  }

  return useQuery({
    queryKey: ["food"],
    queryFn: fetchFood,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useFood;
