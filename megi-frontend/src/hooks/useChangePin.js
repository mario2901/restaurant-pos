import { useMutation } from "@tanstack/react-query";
import { changePin } from "../data/api";

// mutate({ id, pin })
export default function useChangePin() {
  return useMutation({
    mutationFn: ({ id, pin }) => changePin(id, pin),
  });
}
