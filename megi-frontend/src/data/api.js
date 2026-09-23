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

export function getActiveOrders() {
  return request("/orders/active");
}

export function toSubmitRequest({ items, table, userId, orderId }) {
  return {
    ...(orderId && { orderId }),
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
