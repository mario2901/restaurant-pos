import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login } from "../data/api";

export const authKeys = { me: ["auth", "me"] };
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      localStorage.setItem("user", JSON.stringify(user));
      queryClient.setQueryData(authKeys.me, user);
      navigate("/");
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: readUser,
    initialData: readUser,
    staleTime: Infinity,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem("user");
    queryClient.clear();
    navigate("/login");
  };
}
