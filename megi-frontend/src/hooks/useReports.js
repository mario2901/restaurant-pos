import { useMutation } from "@tanstack/react-query";
import { todayReport, todayDelivery } from "../data/api";

export default function useReports() {
  return useMutation({
    mutationFn: (type) => (type === "dostava" ? todayDelivery() : todayReport()),
  });
}
