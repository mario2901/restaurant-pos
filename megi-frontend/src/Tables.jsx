import styles from "./style/Tables.module.css";
import { useCallback, useState } from "react";
import { unutra, terasa, kat } from "./data/Tables.js";
import useActiveOrders from "./hooks/useActiveOders.js";
import useBillOrder from "./hooks/useBillOrder.js";
import OrderDetailsModal from "./OrderDetailsModal.jsx";
import OrderDetails from "./OrderDetails.jsx";

const SPECIAL = [
  { id: "DOSTAVA", name: "Dostava Mišo šoMi", hint: "" },
  { id: "PONIJETI", name: "Za ponijeti", hint: "" },
];
const REONS = [
  { id: "unutra", name: "Unutra", tables: unutra },
  { id: "terasa", name: "Terasa", tables: terasa },
  { id: "kat", name: "Kat", tables: kat },
];
const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const sumTotal = (orders) =>
  orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

export default function Tables({ reon, onReonChange, onSelectTable }) {
  const { byTable, isError } = useActiveOrders();
  const billOrder = useBillOrder();
  const activeReon = REONS.find((r) => r.id === reon) ?? REONS[0];
  const ordersFor = (label) => byTable[String(label)] ?? [];

  // obični sto ima najviše jednu otvorenu narudžbu (backend je ponovo koristi)
  const [selected, setSelected] = useState(null); // { label, name }
  const selectedOrder = selected ? ordersFor(selected.label)[0] : null;

  const { reset: resetBill } = billOrder;
  const closeDetails = useCallback(() => {
    setSelected(null);
    resetBill();
  }, [resetBill]);

  function handleTableClick(label, name) {
    const orders = ordersFor(label);
    console.log(label, name);
    if (orders.length === 0) {
      onSelectTable({ label, name, orders });
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
    // nakon uspjeha React Query osvježi stolove → sto nema narudžbu → modal se sam zatvori
    billOrder.mutate(order.id, { onSuccess: () => setSelected(null) });
  }

  return (
    <div>
      {isError && (
        <p className={styles.error}>Neuspješan dohvat stanja stolova</p>
      )}
      <div className={styles.special}>
        {SPECIAL.map((block) => {
          const orders = ordersFor(block.id);
          const isOccupied = orders.length > 0;

          return (
            <button
              key={block.id}
              className={`${styles.specialBtn} ${
                isOccupied ? styles.occupied : ""
              }`}
              // dostava / za ponijeti: svaki klik je nova narudžba za novog gosta
              onClick={() =>
                onSelectTable({ label: block.id, name: block.name, orders })
              }
            >
              <span className={styles.specialName}>{block.name}</span>
              {isOccupied ? (
                <span className={styles.meta}>
                  {orders.length}{" "}
                  {orders.length === 1 ? "otvorena" : "otvorene"} ·{" "}
                  {formatPrice(sumTotal(orders))}
                </span>
              ) : (
                block.hint && (
                  <span className={styles.specialHint}>{block.hint}</span>
                )
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.buttons}>
        {REONS.map((r) => {
          const occupiedCount = r.tables.filter(
            (t) => ordersFor(t.name).length > 0,
          ).length;

          return (
            <button
              key={r.id}
              className={reon === r.id ? styles.active : ""}
              onClick={() => onReonChange(r.id)}
            >
              {r.name}
              {occupiedCount > 0 && (
                <span className={styles.reonBadge}>{occupiedCount}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className={styles.tables}>
        {activeReon.tables.map((table) => {
          const orders = ordersFor(table.name);
          const isOccupied = orders.length > 0;

          return (
            <div key={table.id}>
              <button
                className={`${styles.tableBtn} ${
                  isOccupied ? styles.occupied : ""
                }`}
                onClick={() => handleTableClick(table.name, table.name)}
              >
                <span className={styles.tableName}>{table.name}</span>
                {isOccupied && (
                  <span className={styles.total}>
                    {formatPrice(sumTotal(orders))}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={closeDetails}
        title={selected?.name}
      >
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onAddMore={handleAddMore}
            onBill={handleBill}
            isBilling={billOrder.isPending}
            error={billOrder.error}
          />
        )}
      </OrderDetailsModal>
    </div>
  );
}
