import styles from "./style/OrdersList.module.css";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Ukupno se računa iz prikazanih stavki — roditelj odlučuje koje stavke šalje
// (npr. RightSideBar samo hranu), pa iznos uvijek odgovara onome što se vidi.
const visibleTotal = (items) =>
  items
    .filter((i) => i.status !== "CANCELLED")
    .reduce(
      (sum, i) => sum + Number(i.lineTotal ?? i.priceAtOrder * i.quantity),
      0,
    );

/**
 * Klikabilna lista narudžbi (najnovija prva).
 * Roditelj šalje već filtrirane narudžbe; klik na karticu -> onSelect(order).
 * timeKey: koje vrijeme se prikazuje i po kojem se sortira ("createdAt" | "closedAt").
 */
export default function OrdersList({
  orders,
  onSelect,
  isPending = false,
  error = null,
  emptyText = "Nema narudžbi.",
  timeKey = "createdAt",
}) {
  const timeOf = (order) => order[timeKey] ?? order.createdAt;
  const sorted = [...orders].sort(
    (a, b) => new Date(timeOf(b)) - new Date(timeOf(a)),
  );

  return (
    <div className={styles.root}>
      {isPending && <p className={styles.message}>Učitavanje...</p>}
      {error && <p className={styles.error}>{error.message}</p>}
      {!isPending && !error && sorted.length === 0 && (
        <p className={styles.message}>{emptyText}</p>
      )}

      <ul className={styles.orderList}>
        {sorted.map((order) => (
          <li
            key={order.id}
            className={styles.card}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(order)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(order)}
          >
            <div className={styles.cardHeader}>
              <span className={styles.table}>{order.table}</span>
              <span className={styles.meta}>#{order.id}</span>
              <span className={styles.time}>{formatTime(timeOf(order))}</span>
            </div>

            {order.note && <p className={styles.orderNote}>{order.note}</p>}

            <ul className={styles.items}>
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.item} ${
                    item.status === "CANCELLED" ? styles.cancelled : ""
                  }`}
                >
                  <span className={styles.qty}>
                    {item.quantity - (item.stornoQuantity ?? 0)}×
                  </span>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>
                      {item.name}
                      {item.detail && (
                        <span className={styles.detail}> · {item.detail}</span>
                      )}
                    </span>
                    {item.options?.length > 0 && (
                      <span className={styles.sub}>
                        + {item.options.join(", ")}
                      </span>
                    )}
                    {item.stornoQuantity > 0 && (
                      <span className={styles.storno}>
                        STORNO {item.stornoQuantity}×
                      </span>
                    )}
                  </div>
                  <span className={styles.lineTotal}>
                    {formatPrice(item.lineTotal ?? 0)}
                  </span>
                </li>
              ))}
            </ul>

            <div className={styles.cardFooter}>
              <span>Ukupno</span>
              <span className={styles.total}>
                {formatPrice(visibleTotal(order.items))}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
