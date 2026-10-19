// Dev (Vite, port 5173): backend na istom računalu, port 8080.
// Produkcija (frontend unutar JAR-a): isti host i port kao stranica -> relativno /api,
// pa radi i ako se port backenda promijeni (server.port).
export const API = import.meta.env.DEV
  ? `http://${window.location.hostname}:8080/api`
  : "/api";
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

export function changeOrderTable(id, table) {
  return request(`/orders/${id}/table`, {
    method: "PATCH",
    body: JSON.stringify({ table }),
  });
}

export function moveOrderToTakeaway(id, note = "") {
  return request(`/orders/${id}/takeaway`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function login(pin) {
  return request("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
}

export function todayReport() {
  return request("/reports/today");
}

export function todayDelivery() {
  return request("/reports/delivery/today");
}

// Konobar mijenja svoj PIN (4-6 znamenki, mora biti jedinstven).
export function changePin(id, pin) {
  return request(`/users/${id}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ pin }),
  });
}

// Dostava robe: dodaje `amount` komada na trenutno stanje (backend: StockRequest.amount).
export function addStock(id, amount) {
  return request(`/drinks/${id}/stock`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export function getAllUser() {
  return request("/users");
}

export function deleteUser(id, active) {
  return request(`/users/${id}/active?active=${active}`, {
    method: "PATCH",
  });
}

export function createUser(user) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

// Print na mrežne printere (backend rutira: kuhinja / šank).
// Vraća { printed }: false = print isključen na backendu -> printaj kroz browser.
// printedAt se ne šalje — backend na tiket stavlja trenutno vrijeme.
export function printTickets(tickets) {
  const body = tickets.map(({ printedAt: _p, empty: _e, ...t }) => t);
  return request("/print", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ==================== ADMIN: JELA / PORCIJE / OPCIJE / PRILOZI / PIĆE ====================

const send = (method, body) => ({
  method,
  ...(body !== undefined && { body: JSON.stringify(body) }),
});

// Jelo: kod kreiranja obavezna barem jedna porcija { size, price }.
export const createFood = (body) => request("/food", send("POST", body));
// Izmjena: samo naziv, opis, kategorija (porcije i opcije imaju svoje endpointe).
export const updateFood = (id, body) => request(`/food/${id}`, send("PUT", body));
export const setFoodAvailable = (id, available) =>
  request(`/food/${id}/availability?available=${available}`, send("PATCH"));
export const deleteFood = (id) => request(`/food/${id}`, send("DELETE"));

export const addPortion = (foodId, body) =>
  request(`/food/${foodId}/portions`, send("POST", body));
export const updatePortion = (portionId, body) =>
  request(`/food/portions/${portionId}`, send("PUT", body));
export const deletePortion = (portionId) =>
  request(`/food/portions/${portionId}`, send("DELETE"));

// Opcija: portionId null = vrijedi za sve porcije. Izmjena mijenja samo naziv i doplatu.
export const addOption = (foodId, body) =>
  request(`/food/${foodId}/options`, send("POST", body));
export const updateOption = (optionId, body) =>
  request(`/food/options/${optionId}`, send("PUT", body));
export const deleteOption = (optionId) =>
  request(`/food/options/${optionId}`, send("DELETE"));

export const createAddon = (body) => request("/addons", send("POST", body));
export const updateAddon = (id, body) => request(`/addons/${id}`, send("PUT", body));
export const setAddonAvailable = (id, available) =>
  request(`/addons/${id}/availability?available=${available}`, send("PATCH"));
export const deleteAddon = (id) => request(`/addons/${id}`, send("DELETE"));

// Piće: stock se uzima samo kod kreiranja; kasnije ide preko /drinks/{id}/stock.
export const createDrink = (body) => request("/drinks", send("POST", body));
export const updateDrink = (id, body) => request(`/drinks/${id}`, send("PUT", body));
export const setDrinkAvailable = (id, available) =>
  request(`/drinks/${id}/availability?available=${available}`, send("PATCH"));
export const deleteDrink = (id) => request(`/drinks/${id}`, send("DELETE"));

// ==================== IZVJEŠTAJI PO DANU ====================
// date = "YYYY-MM-DD" (lokalni datum, ne toISOString — to bi pomaknulo dan zbog UTC-a)

export const getDayReport = (date) => request(`/reports/day?date=${date}`);
export const getDeliveryDayReport = (date) =>
  request(`/reports/delivery/day?date=${date}`);

// Inventura: postavi TOČNO stanje (backend: PUT /drinks/{id}/stock, StockRequest.amount >= 0).
export function setStock(id, amount) {
  return request(`/drinks/${id}/stock`, {
    method: "PUT",
    body: JSON.stringify({ amount }),
  });
}

// ==================== NEISPRINTANI TIKETI ====================
// Backend pamti automatske ispise koje printer nije ispisao (papir, poklopac, ugašen...).

export const getFailedPrints = () => request("/print/failed");
export const retryFailedPrint = (id) =>
  request(`/print/failed/${id}/retry`, { method: "POST" });
export const dismissFailedPrint = (id) =>
  request(`/print/failed/${id}`, { method: "DELETE" });

// ==================== ADMIN POSTAVKE ====================
// { drinksTracked } — obračun pića (izvještaji + zaliha)

export const getSettings = () => request("/settings");
export const updateSettings = (body) =>
  request("/settings", { method: "PUT", body: JSON.stringify(body) });

// ==================== PRINTERI (Admin) ====================
export const checkPrinter = (printer) => request(`/print/check/${printer}`);
export const testPrinter = (printer) =>
  request(`/print/test/${printer}`, { method: "POST" });
export const getWindowsPrinters = () => request("/print/windows-printers");

// ==================== BACKUP ====================
export const getBackupStatus = () => request("/backup");
export const createBackup = () => request("/backup", { method: "POST" });
