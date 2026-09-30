import { useQuery } from "@tanstack/react-query";
import { API } from "../data/api";

const useDrink = () => {
  async function fetchDrink() {
    const response = await fetch(`${API}/drinks?onlyAvailable=true`);
    if (!response.ok) throw new Error("Greška pri učitavanju jela");
    return response.json();
  }

  return useQuery({
    queryKey: ["menu", "drink"],
    queryFn: fetchDrink,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useDrink;
