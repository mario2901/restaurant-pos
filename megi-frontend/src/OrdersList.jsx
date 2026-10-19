import { useMemo, useState } from "react";
import styles from "./style/OrdersList.module.css";
import { TbTruckDelivery, TbPaperBag, TbArmchair } from "react-icons/tb";

// Vrsta narudžbe po oznaci stola — boja ruba, pozadina i oznaka kartice
const KIND = {
  DOSTAVA: { cls: "kindDelivery", label: "Dostava", Icon: TbTruckDelivery },
  PONIJETI: { cls: "kindTakeaway", label: "Za ponijeti", Icon: TbPaperBag },
};
const TABLE_KIND = { cls: "kindTable", label: "Stol", Icon: TbArmchair };
const kindOf = (table) => KIND[table] ?? TABLE_KIND;

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
 * pageSize: ako je zadan, renderira se samo toliko najnovijih narudžbi, a gumb
 *           "Prikaži još" dodaje sljedećih pageSize (sve je već dohvaćeno —
 *           štedi se samo render). Reset: roditelj promijeni `key`.
 */
export default function OrdersList({
  orders,
  onSelect,
  isPending = false,
  error = null,
  emptyText = "Nema narudžbi.",
  timeKey = "createdAt",
  pageSize = null,
}) {
  const [limit, setLimit] = useState(pageSize);

  const sorted = useMemo(() => {
    const timeOf = (order) => order[timeKey] ?? order.createdAt;
    return [...orders].sort(
      (a, b) => new Date(timeOf(b)) - new Date(timeOf(a)),
    );
  }, [orders, timeKey]);

  const shown = limit ? sorted.slice(0, limit) : sorted;
  const remaining = sorted.length - shown.length;
  const timeOf = (order) => order[timeKey] ?? order.createdAt;

  return (
    <div className={styles.root}>
      {isPending && <p className={styles.message}>Učitavanje...</p>}
      {error && <p className={styles.error}>{error.message}</p>}
      {!isPending && !error && sorted.length === 0 && (
        <p className={styles.message}>{emptyText}</p>
      )}

      <ul className={styles.orderList}>
        {shown.map((order) => {
          const kind = kindOf(order.table);
          const { Icon } = kind;
          return (
          <li
            key={order.id}
            className={`${styles.card} ${styles[kind.cls]}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(order)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(order)}
          >
            <div className={styles.cardHeader}>
              <span className={styles.table}>
                <span className={styles.kindBadge}>
                  <Icon size={14} />
                  {kind.label}
                </span>
                {kind === TABLE_KIND && order.table}
              </span>
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
          );
        })}
      </ul>

      {remaining > 0 && (
        <button
          type="button"
          className={styles.moreBtn}
          onClick={() => setLimit((l) => l + pageSize)}
        >
          Prikaži još {Math.min(pageSize, remaining)}
          <span className={styles.moreCount}>
            ({shown.length} od {sorted.length})
          </span>
        </button>
      )}
    </div>
  );
}
