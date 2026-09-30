import { createContext, useCallback, useReducer, useState } from "react";

export const OrderContext = createContext({
  items: [],
  totalPrice: 0,
  totalCount: 0,
  addItemToOrder: () => {},
  updateItemQuantity: () => {},
  removeItemFromOrder: () => {},
  clearOrder: () => {},
  // odabrani stol / DOSTAVA / PONIJETI (null = početni ekran sa stolovima)
  table: null,
  selectTable: () => {},
  finishOrder: () => {},
  pendingTable: null,
  confirmTableChange: () => {},
  cancelTableChange: () => {},
  // tiketi za pregled/print (Naruči, Račun, Storno) — modal je u App.jsx
  tickets: null,
  showTickets: () => {},
  closeTickets: () => {},
});

// Isti "kontekst narudžbe" = isti stol/blok i ista postojeća narudžba
const sameTarget = (a, b) =>
  a?.label === b?.label && (a?.orderId ?? null) === (b?.orderId ?? null);

const ITEM_TYPES = ["FOOD", "DRINK", "ADDON"];

// Tipovi kod kojih je cijena direktno na itemu (bez porcija i opcija)
const FLAT_PRICE_TYPES = ["DRINK", "ADDON"];

function buildLineId(type, itemId, portionId, options, note) {
  const optionIds = options
    .map((o) => String(o.id))
    .sort()
    .join(",");
  return `${type}|${itemId}|${portionId ?? "-"}|${optionIds}|${note}`;
}

// Vraća { portionId, size, basePrice } ili null ako payload nije ispravan
function resolvePricing(type, item, portion) {
  if (type === "FOOD") {
    if (!portion?.id || !Number.isFinite(Number(portion.price))) return null;
    return {
      portionId: portion.id,
      size: portion.size ?? null,
      basePrice: Number(portion.price),
    };
  }

  // DRINK i ADDON – nema porcija, cijena je na samom itemu
  if (FLAT_PRICE_TYPES.includes(type)) {
    if (!Number.isFinite(Number(item.price))) return null;
    return {
      portionId: null,
      size: null,
      basePrice: Number(item.price),
    };
  }

  return null;
}

function orderReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const {
        item,
        portion,
        type,
        amount,
        options = [],
        note = "",
      } = action.payload;

      if (!ITEM_TYPES.includes(type) || !item?.id) {
        console.warn("Neispravan ADD payload:", action.payload);
        return state;
      }

      const pricing = resolvePricing(type, item, portion);
      if (!pricing) {
        console.warn("Neispravna cijena/porcija:", action.payload);
        return state;
      }

      // Opcije postoje samo za FOOD
      const safeOptions =
        type === "FOOD" && Array.isArray(options) ? options : [];
      const qty = Number(amount) > 0 ? Number(amount) : 1;
      const cleanNote = (note ?? "").trim();
      const lineId = buildLineId(
        type,
        item.id,
        pricing.portionId,
        safeOptions,
        cleanNote,
      );

      const existing = state.items.find((i) => i.lineId === lineId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.lineId === lineId ? { ...i, amount: i.amount + qty } : i,
          ),
        };
      }

      const optionsPrice = safeOptions.reduce(
        (sum, o) => sum + (Number(o.extraPrice) || 0),
        0,
      );

      const newLine = {
        lineId,
        type,
        itemId: item.id,
        name: item.name,
        portionId: pricing.portionId,
        size: pricing.size,
        basePrice: pricing.basePrice,
        options: safeOptions.map((o) => ({
          id: o.id,
          name: o.name,
          extraPrice: Number(o.extraPrice) || 0,
        })),
        unitPrice: pricing.basePrice + optionsPrice,
        note: cleanNote,
        amount: qty,
      };

      return { ...state, items: [...state.items, newLine] };
    }

    case "UPDATE": {
      const { lineId, delta } = action.payload;
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.lineId === lineId ? { ...i, amount: i.amount + delta } : i,
          )
          .filter((i) => i.amount > 0),
      };
    }

    case "REMOVE": {
      return {
        ...state,
        items: state.items.filter((i) => i.lineId !== action.payload.lineId),
      };
    }

    case "CLEAR": {
      return { ...state, items: [] };
    }

    default:
      return state;
  }
}

export default function OrderContextProvider({ children }) {
  const [orderState, orderDispatch] = useReducer(orderReducer, {
    items: [],
  });
  const [table, setTable] = useState(null);
  // { next } dok čeka potvrdu odbacivanja; next može biti null ("← Stolovi")
  const [pendingTable, setPendingTable] = useState(null);
  const [tickets, setTickets] = useState(null);

  const showTickets = useCallback((list) => {
    if (Array.isArray(list) && list.length > 0) setTickets(list);
  }, []);
  const closeTickets = useCallback(() => setTickets(null), []);

  /**
   * Svaka promjena stola (drugi stol, DOSTAVA/PONIJETI, "Dodaj još" na drugu
   * narudžbu ili "← Stolovi") briše neposlanu košaricu — ako nije prazna,
   * prvo se traži potvrda (pendingTable → modal u App.jsx).
   */
  function selectTable(next) {
    if (sameTarget(table, next)) {
      setTable(next);
      return;
    }
    if (orderState.items.length > 0) {
      setPendingTable({ next });
      return;
    }
    setTable(next);
  }

  function confirmTableChange() {
    if (!pendingTable) return;
    orderDispatch({ type: "CLEAR" });
    setTable(pendingTable.next);
    setPendingTable(null);
  }

  const cancelTableChange = useCallback(() => setPendingTable(null), []);

  /** Narudžba poslana: očisti košaricu i vrati na početni ekran bez pitanja. */
  function finishOrder() {
    orderDispatch({ type: "CLEAR" });
    setPendingTable(null);
    setTable(null);
  }

  function handleAddItemToOrder({
    item,
    portion = null,
    type,
    amount = 1,
    options = [],
    note = "",
  }) {
    orderDispatch({
      type: "ADD",
      payload: { item, portion, type, amount, options, note },
    });
  }

  function handleUpdateItemQuantity(lineId, delta) {
    orderDispatch({ type: "UPDATE", payload: { lineId, delta } });
  }

  function handleRemoveItemFromOrder(lineId) {
    orderDispatch({ type: "REMOVE", payload: { lineId } });
  }

  function handleClearOrder() {
    orderDispatch({ type: "CLEAR" });
  }

  const totalPrice = orderState.items.reduce(
    (sum, i) => sum + i.unitPrice * i.amount,
    0,
  );
  const totalCount = orderState.items.reduce((sum, i) => sum + i.amount, 0);

  const ctxValue = {
    items: orderState.items,
    totalPrice,
    totalCount,
    addItemToOrder: handleAddItemToOrder,
    updateItemQuantity: handleUpdateItemQuantity,
    removeItemFromOrder: handleRemoveItemFromOrder,
    clearOrder: handleClearOrder,
    table,
    selectTable,
    finishOrder,
    pendingTable,
    confirmTableChange,
    cancelTableChange,
    tickets,
    showTickets,
    closeTickets,
  };

  return (
    <OrderContext.Provider value={ctxValue}>{children}</OrderContext.Provider>
  );
}
