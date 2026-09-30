export const API = `http://${window.location.hostname}:8080/api`;

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const fieldMsg = data?.fieldErrors
      ? Object.values(data.fieldErrors).join(", ")
      : "";
    throw new Error(data?.error || fieldMsg || `Greška ${res.status}`);
  }

  return data;
}
export function submitOrder(body) {
  return request("/orders/submit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function closeOrder(id) {
  return request(`/orders/${id}/close`, {
    method: "POST",
  });
}

export function billOrder(id) {
  return request(`/orders/${id}/bill`, {
    method: "POST",
  });
}

// Storno dijela/cijele stavke; quantity undefined = sve preostalo.
// Vraća { order, tickets } (STORNO_KITCHEN / STORNO_BAR).
export function stornoItem(orderId, itemId, quantity) {
  return request(`/orders/${orderId}/items/${itemId}/storno`, {
    method: "PATCH",
    body: JSON.stringify(quantity ? { quantity } : {}),
  });
}

// Više označenih stavki odjednom: items = [{ itemId, quantity? }], jedan set tiketa.
export function stornoItems(orderId, items) {
  return request(`/orders/${orderId}/storno/items`, {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

// scope: "FOOD" (hrana + prilozi) | "DRINK" | "ALL". Vraća { order, tickets }.
export function stornoOrder(orderId, scope) {
  return request(`/orders/${orderId}/storno`, {
    method: "PATCH",
    body: JSON.stringify({ scope }),
  });
}

export function getTodayOrders() {
  return request("/orders/today");
}

export function toSubmitRequest({ items, table, userId, orderId, note }) {
  return {
    ...(orderId && { orderId }),
    ...(note?.trim() && { note: note.trim() }),
    table,
    userId,
    items: items.map((line) => {
      const type = line.type ?? "FOOD";

      if (type === "DRINK") {
        return { type, drinkId: line.itemId, quantity: line.amount };
      }
      if (type === "ADDON") {
        return { type, addonId: line.itemId, quantity: line.amount };
      }
      return {
        type: "FOOD",
        foodId: line.itemId,
        portionId: line.portionId,
        optionIds: line.options.map((o) => o.id),
        quantity: line.amount,
        ...(line.note && { note: line.note }),
      };
    }),
  };
}
