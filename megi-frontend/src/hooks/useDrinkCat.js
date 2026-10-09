import { API } from "../data/api.js";
import { useQuery } from "@tanstack/react-query";

const useDrinkCat = () => {
  async function fetchDrinkCategories() {
    const response = await fetch(`${API}/drinks/categories`);
    return response.json();
  }

  return useQuery({
    queryKey: ["menu", "categories"],
    queryFn: fetchDrinkCategories,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export default useDrinkCat;
