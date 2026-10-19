import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addStock } from "../data/api";

const DRINKS_KEY = ["menu", "drink"];

export default function useAddStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }) => addStock(id, amount),
    onSuccess: (updated) => {
      // odmah upiši novo stanje u keš (lista ima staleTime: Infinity)
      queryClient.setQueryData(DRINKS_KEY, (old) =>
        old?.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)),
      );
      queryClient.invalidateQueries({ queryKey: DRINKS_KEY });
    },
  });
}
