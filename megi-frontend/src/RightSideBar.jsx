import styles from "./style/RightSideBarStyle.module.css";
import Order from "./Order";
import useOrders from "./hooks/useOrders";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RightSideBar({ table }) {
  const { data: orders = [], isPending, error } = useOrders();
  // najnovija narudžba prva
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <aside className={styles.sidebar}>
      {table && <Order table={table} />}
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
            <li key={order.id} className={styles.card}>
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
                          <span className={styles.detail}> {item.detail} </span>
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
                <span className={styles.total}>{formatPrice(order.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
