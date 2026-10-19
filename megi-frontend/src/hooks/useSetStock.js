import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setStock } from "../data/api";

const DRINKS_KEY = ["menu", "drink"];

/** Inventura: mutate({ id, amount }) postavlja točno stanje pića. */
export default function useSetStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }) => setStock(id, amount),
    onSuccess: (updated) => {
      // odmah upiši novo stanje u obje liste (konobar + admin "all")
      const patch = (old) =>
        old?.map((d) => (d.id === updated.id ? { ...d, ...updated } : d));
      queryClient.setQueryData(DRINKS_KEY, patch);
      queryClient.setQueryData([...DRINKS_KEY, "all"], patch);
      // liste imaju refetchOnMount: false -> osvježi i neaktivne
      return queryClient.invalidateQueries({
        queryKey: DRINKS_KEY,
        refetchType: "all",
      });
    },
  });
}
