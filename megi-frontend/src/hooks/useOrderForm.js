import { useContext, useState } from "react";
import { OrderContext } from "../context/OrderContext.jsx";
import useSubmitOrder from "./useSubmit.js";
import { toSubmitRequest } from "../data/api.js";
import { useMe } from "./useLogin.js";

const NOTE_TABLES = ["DOSTAVA", "PONIJETI"];
export const ORDER_NOTE_MAX = 120;

/** Naslov narudžbe: "Dostava", "Za ponijeti" ili "Stol U3". */
export const orderTitle = (label) =>
  label === "DOSTAVA"
    ? "Dostava"
    : label === "PONIJETI"
      ? "Za ponijeti"
      : `Stol ${label ?? ""}`;

/**
 * Košarica + slanje narudžbe — zajedničko za desktop (Order) i mobitel (MobileCart).
 *
 * @param table   odabrani stol iz OrderContexta ({ label, orders, orderId })
 * @param orderId postojeća narudžba za "Dodaj još" (undefined = nova)
 * @param onSent  rezultat backenda ({ order, tickets, printed, printError })
 */
export default function useOrderForm({ table, orderId, onSent }) {
  const {
    items,
    totalPrice,
    totalCount,
    updateItemQuantity,
    removeItemFromOrder,
    clearOrder,
    finishOrder,
  } = useContext(OrderContext);
  const { data: user } = useMe();
  const { mutate, isPending, isError, error, reset } = useSubmitOrder();

  const tableLabel = table?.label;
  const isEmpty = items.length === 0;
  const hasNote = NOTE_TABLES.includes(tableLabel);
  // "Dodaj još" na postojeću dostavu: predpopuni njenu napomenu
  const [note, setNote] = useState(
    () => table?.orders?.find((o) => o.id === orderId)?.note ?? "",
  );
  const canSend = !isEmpty && !isPending && !!tableLabel && !!user?.id;

  function send() {
    if (!canSend) return;
    mutate(
      toSubmitRequest({
        items,
        table: tableLabel,
        userId: user.id,
        orderId,
        note: hasNote ? note : undefined,
      }),
      {
        onSuccess: (result) => {
          // backend je već poslao na printere; prvo tiketi, pa povratak na stolove
          onSent?.(result);
          finishOrder();
        },
      },
    );
  }

  function clear() {
    clearOrder();
    setNote("");
    reset();
  }

  return {
    items,
    totalPrice,
    totalCount,
    isEmpty,
    tableLabel,
    title: orderTitle(tableLabel),
    hasNote,
    note,
    setNote,
    noteLabel: tableLabel === "DOSTAVA" ? "Adresa / napomena" : "Ime / telefon",
    notePlaceholder:
      tableLabel === "DOSTAVA"
        ? "npr. Adresa, 061 123 456"
        : "npr. Ime, 063 111 222",
    canSend,
    isPending,
    isError,
    error,
    send,
    clear,
    updateItemQuantity,
    removeItemFromOrder,
  };
}
