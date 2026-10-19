import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllUser, deleteUser, createUser } from "../data/api";

const usersKey = ["users"];

export default function useUsers() {
  return useQuery({
    queryKey: usersKey,
    queryFn: getAllUser,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }) => deleteUser(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}
