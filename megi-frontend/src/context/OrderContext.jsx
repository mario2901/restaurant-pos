import { createContext, useReducer } from "react";
import useFood from "../hooks/useFood";

export const OrderContext = createContext({
  items: [],
  totalPrice: 0,
  totalCount: 0,
  addItemToOrder: () => {},
  updateItemQuantity: () => {},
  removeItemFromOrder: () => {},
  clearOrder: () => {},
});

function buildLineId(itemId, portionId, options, note) {
  const optionIds = options
    .map((o) => String(o.id))
    .sort()
    .join(",");
  return `${itemId}|${portionId}|${optionIds}|${note}`;
}

function orderReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const { item, portion, amount, options = [], note = "" } = action.payload;

      if (
        !item?.id ||
        !portion?.id ||
        !Number.isFinite(Number(portion.price))
      ) {
        console.warn("Neispravan ADD payload:", action.payload);
        return state;
      }

      const qty = Number(amount) > 0 ? Number(amount) : 1;
      const cleanNote = note.trim();
      const lineId = buildLineId(item.id, portion.id, options, cleanNote);

      const existing = state.items.find((i) => i.lineId === lineId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.lineId === lineId ? { ...i, amount: i.amount + qty } : i,
          ),
        };
      }

      const optionsPrice = options.reduce(
        (sum, o) => sum + (Number(o.extraPrice) || 0),
        0,
      );

      const newLine = {
        lineId,
        itemId: item.id,
        name: item.name,
        portionId: portion.id,
        size: portion.size,
        portionPrice: Number(portion.price),
        options: options.map((o) => ({
          id: o.id,
          name: o.name,
          extraPrice: Number(o.extraPrice) || 0,
        })),
        unitPrice: Number(portion.price) + optionsPrice,
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

  function handleAddItemToOrder({
    item,
    portion,
    amount = 1,
    options = [],
    note = "",
  }) {
    orderDispatch({
      type: "ADD",
      payload: { item, portion, amount, options, note },
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
  };
  return (
    <OrderContext.Provider value={ctxValue}>{children}</OrderContext.Provider>
  );
}
