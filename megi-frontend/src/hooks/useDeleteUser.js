import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "../data/api";

export default function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }) => deleteUser(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
