import { useCallback, useContext, useMemo, useState } from "react";
import useOrders from "./useOrders.js";
import useBillOrder from "./useBillOrder.js";
import { OrderContext } from "../context/OrderContext.jsx";

/**
 * Stanje stolova za ekran sa stolovima (desktop i mobitel):
 *  - otvorene (NEW) narudžbe po oznaci stola
 *  - klik na slobodan stol -> meni; na zauzet -> detalji narudžbe (Dodaj još / Račun)
 *
 * @param onSelectTable  selectTable iz OrderContexta
 * @returns ordersFor(label), isError, handleTableClick(label, name), dialogProps za OrderDetailsDialog
 */
export default function useTableOrders(onSelectTable) {
  const { data: orders = [], isError } = useOrders();
  const billOrder = useBillOrder();
  const { showTickets } = useContext(OrderContext);

  // stol je zauzet dok ima otvorenu (NEW) narudžbu
  const byTable = useMemo(() => {
    const map = {};
    for (const order of orders) {
      if (order.status !== "NEW") continue;
      (map[String(order.table)] ??= []).push(order);
    }
    return map;
  }, [orders]);

  const ordersFor = useCallback(
    (label) => byTable[String(label)] ?? [],
    [byTable],
  );

  // obični stol ima najviše jednu otvorenu narudžbu (backend je ponovo koristi)
  const [selected, setSelected] = useState(null); // { label, name }
  const selectedOrder = selected
    ? (ordersFor(selected.label)[0] ?? null)
    : null;

  const { reset: resetBill } = billOrder;
  const closeDetails = useCallback(() => {
    setSelected(null);
    resetBill();
  }, [resetBill]);

  function handleTableClick(label, name) {
    const list = ordersFor(label);
    if (list.length === 0) {
      onSelectTable({ label, name, orders: list });
    } else {
      setSelected({ label, name });
    }
  }

  function handleAddMore(order) {
    const { label, name } = selected;
    setSelected(null);
    onSelectTable({ label, name, orders: [order], orderId: order.id });
  }

  function handleBill(order) {
    // nakon uspjeha React Query osvježi stolove -> stol nema narudžbu -> modal se sam zatvori
    billOrder.mutate(order.id, {
      onSuccess: (result) => {
        setSelected(null);
        showTickets(result);
      },
    });
  }

  return {
    ordersFor,
    isError,
    handleTableClick,
    dialogProps: {
      order: selectedOrder,
      title: selected?.name,
      onClose: closeDetails,
      onAddMore: handleAddMore,
      onBill: handleBill,
      isBilling: billOrder.isPending,
      billError: billOrder.error,
    },
  };
}
