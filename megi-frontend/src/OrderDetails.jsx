import { useState } from "react";
import styles from "./style/OrderDetails.module.css";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("hr-HR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function OrderDetails({
  order,
  onAddMore,
  onBill,
  isBilling,
  error,
  canBill = true,
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.details}>
      <p className={styles.meta}>
        #{order.id} · otvoreno {formatTime(order.createdAt)}
        {order.userName && ` · ${order.userName}`}
      </p>

      <ul className={styles.items}>
        {order.items.map((item) => (
          <li
            key={item.id}
            className={`${styles.item} ${
              item.status === "CANCELLED" ? styles.cancelled : ""
            }`}
          >
            <span className={styles.qty}>{item.quantity}×</span>
            <span className={styles.info}>
              <span className={styles.name}>
                {item.name}
                {item.detail && (
                  <span className={styles.detail}> · {item.detail}</span>
                )}
              </span>
              {item.options?.length > 0 && (
                <span className={styles.sub}>+ {item.options.join(", ")}</span>
              )}
              {item.note && <span className={styles.sub}>{item.note}</span>}
            </span>
            <span
              className={`${styles.tag} ${
                item.type === "DRINK" ? styles.bar : styles.kitchen
              }`}
            >
              {item.type === "DRINK" ? "Šank" : "Kuhinja"}
            </span>
            <span className={styles.price}>
              {formatPrice(item.lineTotal ?? item.priceAtOrder * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.total}>
        <span>Ukupno</span>
        <strong>{formatPrice(order.total ?? 0)}</strong>
      </div>

      {error && <p className={styles.error}>{error.message}</p>}

      {confirming ? (
        <div className={styles.confirm}>
          <p>Izdati račun? Narudžba se zatvara i sto postaje slobodan.</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setConfirming(false)}
              disabled={isBilling}
            >
              Odustani
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => onBill(order)}
              disabled={isBilling}
            >
              {isBilling ? "Šaljem..." : "Printaj račun"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {order.status === "NEW" && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => onAddMore(order)}
            >
              + Dodaj još
            </button>
          )}
          {canBill && order.status !== "CANCELED" && (
            <button
              type="button"
              className={styles.primary}
              onClick={() => setConfirming(true)}
            >
              Račun
            </button>
          )}
        </div>
      )}
    </div>
  );
}
