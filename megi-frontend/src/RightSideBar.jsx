import styles from "./style/RightSideBarStyle.module.css";
import Order from "./Order";
import useOrders from "./hooks/useOrders";
import OrderDetails from "./OrderDetails";
import OrderDetailsModal from "./OrderDetailsModal";
import useBillOrder from "./hooks/useBillOrder";
import { useState, useCallback } from "react";
const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RightSideBar({ table, onSelectTable }) {
  const billOrder = useBillOrder();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { reset: resetBill } = billOrder;
  const { data: orders = [], isPending, error } = useOrders();
  // najnovija narudžba prva
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const closeDetails = useCallback(() => {
    setSelectedOrder(null);
    resetBill();
  }, [resetBill]);

  function handleAddMore(order) {
    onSelectTable({
      label: order.table,
      name:
        order.table === "DOSTAVA"
          ? "Dostava"
          : order.table === "PONIJETI"
            ? "Za ponijeti"
            : order.table,
      orders: [order],
      orderId: order.id,
    });
    setSelectedOrder(null);
  }
  function handleBill(order) {
    // nakon uspjeha React Query osvježi stolove → sto nema narudžbu → modal se sam zatvori
    billOrder.mutate(order.id, { onSuccess: () => setSelectedOrder(null) });
  }

  return (
    <>
      <aside className={styles.sidebar}>
        {table && <Order table={table} orderId={table.orderId} />}
        <div className={styles.orders}>
          <div className={styles.ordersHeader}>
            <h3 className={styles.ordersTitle}>Narudžbe</h3>
            {orders.length > 0 && (
              <span className={styles.ordersCount}>{orders.length}</span>
            )}
          </div>

          {isPending && <p className={styles.message}>Učitavanje...</p>}
          {error && <p className={styles.error}>{error.message}</p>}
          {!isPending && !error && orders.length === 0 && (
            <p className={styles.message}>Nema otvorenih narudžbi.</p>
          )}

          <ul className={styles.orderList}>
            {sortedOrders.map((order) => (
              <li
                key={order.id}
                className={styles.card}
                type="button"
                onClick={() => setSelectedOrder(order)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.table}>{order.table}</span>
                  <span className={styles.meta}>#{order.id}</span>
                  <span className={styles.time}>
                    {formatTime(order.createdAt)}
                  </span>
                </div>

                <ul className={styles.items}>
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className={`${styles.item} ${
                        item.status === "CANCELLED" ? styles.cancelled : ""
                      }`}
                    >
                      <span className={styles.qty}>{item.quantity}×</span>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>
                          {item.name} -
                          {item.detail && (
                            <span className={styles.detail}>
                              {" "}
                              {item.detail}{" "}
                            </span>
                          )}
                          {item.options?.length > 0 && (
                            <span className={styles.sub}>
                              + {item.options.join(", ")}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className={styles.lineTotal}>
                        {formatPrice(
                          item.lineTotal ?? item.priceAtOrder * item.quantity,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className={styles.cardFooter}>
                  <span>Ukupno</span>
                  <span className={styles.total}>
                    {formatPrice(order.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={closeDetails}
        title={selectedOrder?.table}
      >
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onAddMore={handleAddMore}
            onBill={handleBill}
            isBilling={billOrder.isPending}
            error={billOrder.error}
            canBill={
              selectedOrder.table === "DOSTAVA" ||
              selectedOrder.table === "PONIJETI"
            }
          />
        )}
      </OrderDetailsModal>
    </>
  );
}
