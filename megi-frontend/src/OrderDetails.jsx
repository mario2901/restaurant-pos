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

const SCOPE_LABEL = {
  FOOD: "svu hranu",
  DRINK: "sva pića",
  ALL: "cijelu narudžbu",
};

const activeQty = (item) => item.quantity - (item.stornoQuantity ?? 0);
// storno samo za poslane stavke koje još imaju nestorniranih komada
const isStornable = (item) => item.status === "SENT" && activeQty(item) > 0;
const isFoodSide = (item) => item.type === "FOOD" || item.type === "ADDON";

export default function OrderDetails({
  order,
  onAddMore,
  onBill,
  isBilling,
  error,
  canBill = true,
  editing = false,
  storno,
}) {
  const [confirming, setConfirming] = useState(false);
  // storno koji čeka potvrdu: { label, request }
  const [pendingStorno, setPendingStorno] = useState(null);
  // označene stavke za storno: { [itemId]: količina }
  const [selected, setSelected] = useState({});

  const stornable = order.items.filter(isStornable);
  const hasFood = stornable.some(isFoodSide);
  const hasDrink = stornable.some((i) => i.type === "DRINK");

  const selectedIds = Object.keys(selected).map(Number);
  const selectedCount = selectedIds.length;

  function toggleSelect(item) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.id] != null) delete next[item.id];
      else next[item.id] = activeQty(item); // default: sve preostalo
      return next;
    });
  }

  function changeSelectedQty(item, delta) {
    setSelected((prev) => {
      const current = prev[item.id] ?? activeQty(item);
      const qty = Math.min(activeQty(item), Math.max(1, current + delta));
      return { ...prev, [item.id]: qty };
    });
  }

  function askSelectedStorno() {
    const chosen = order.items.filter((i) => selected[i.id] != null);
    setPendingStorno({
      label: chosen.map((i) => `${selected[i.id]}× ${i.name}`).join(", "),
      request: {
        kind: "items",
        orderId: order.id,
        items: chosen.map((i) => ({
          itemId: i.id,
          // cijela stavka -> bez quantity (backend stornira sve preostalo)
          ...(selected[i.id] < activeQty(i) && { quantity: selected[i.id] }),
        })),
      },
    });
  }

  function askOrderStorno(scope) {
    setPendingStorno({
      label: SCOPE_LABEL[scope],
      request: { kind: "order", orderId: order.id, scope },
    });
  }

  function confirmStorno() {
    storno.mutate(pendingStorno.request, {
      onSuccess: () => {
        setPendingStorno(null);
        setSelected({});
      },
    });
  }

  return (
    <div className={styles.details}>
      <p className={styles.meta}>
        #{order.id} · otvoreno {formatTime(order.createdAt)}
        {order.userName && ` · ${order.userName}`}
      </p>

      {order.note && <p className={styles.orderNote}>{order.note}</p>}

      <ul className={styles.items}>
        {order.items.map((item) => (
          <li
            key={item.id}
            className={`${styles.item} ${
              item.status === "CANCELLED" ? styles.cancelled : ""
            } ${editing && isStornable(item) ? styles.selectable : ""} ${
              selected[item.id] != null ? styles.selected : ""
            }`}
            onClick={
              editing && isStornable(item) && !pendingStorno
                ? () => toggleSelect(item)
                : undefined
            }
          >
            <span className={styles.qty}>
                        {item.quantity - (item.stornoQuantity ?? 0)}×
                      </span>
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
              {item.stornoQuantity > 0 && (
                <span className={styles.storno}>
                  STORNO {item.stornoQuantity}×
                </span>
              )}
            </span>
            <span
              className={`${styles.tag} ${
                item.type === "DRINK" ? styles.bar : styles.kitchen
              }`}
            >
              {item.type === "DRINK" ? "Šank" : "Kuhinja"}
            </span>
            <span className={styles.price}>
              {formatPrice(item.lineTotal ?? 0)}
            </span>

            {editing && selected[item.id] != null && activeQty(item) > 1 && (
              <div
                className={styles.itemStorno}
                onClick={(e) => e.stopPropagation()}
              >
                <span className={styles.stornoLabel}>Storno komada:</span>
                <button
                  type="button"
                  className={styles.stornoStep}
                  onClick={() => changeSelectedQty(item, -1)}
                  disabled={selected[item.id] <= 1 || !!pendingStorno}
                  aria-label="Manje"
                >
                  &minus;
                </button>
                <span className={styles.stornoQty}>
                  {selected[item.id]} / {activeQty(item)}
                </span>
                <button
                  type="button"
                  className={styles.stornoStep}
                  onClick={() => changeSelectedQty(item, 1)}
                  disabled={selected[item.id] >= activeQty(item) || !!pendingStorno}
                  aria-label="Više"
                >
                  +
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.total}>
        <span>Ukupno</span>
        <strong>{formatPrice(order.total ?? 0)}</strong>
      </div>

      {error && <p className={styles.error}>{error.message}</p>}
      {storno?.error && <p className={styles.error}>{storno.error.message}</p>}

      {editing ? (
        pendingStorno ? (
          <div className={styles.confirm}>
            <p>
              Stornirati <strong>{pendingStorno.label}</strong>? Storno tiket
              ide u kuhinju/šank i iznos se skida s prometa.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setPendingStorno(null)}
                disabled={storno.isPending}
              >
                Odustani
              </button>
              <button
                type="button"
                className={styles.danger}
                onClick={confirmStorno}
                disabled={storno.isPending}
              >
                {storno.isPending ? "Storniram..." : "Storniraj"}
              </button>
            </div>
          </div>
        ) : stornable.length === 0 ? (
          <p className={styles.meta}>Nema stavki za storno.</p>
        ) : selectedCount > 0 ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setSelected({})}
            >
              Poništi odabir
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={askSelectedStorno}
            >
              Storniraj označeno ({selectedCount})
            </button>
          </div>
        ) : (
          <div className={styles.scopeActions}>
            <p className={styles.hint}>
              Dodirni stavke za storno ili odaberi brzu opciju:
            </p>
            {hasFood && (
              <button
                type="button"
                className={styles.stornoScopeBtn}
                onClick={() => askOrderStorno("FOOD")}
              >
                Storno hrane
              </button>
            )}
            {hasDrink && (
              <button
                type="button"
                className={styles.stornoScopeBtn}
                onClick={() => askOrderStorno("DRINK")}
              >
                Storno pića
              </button>
            )}
            <button
              type="button"
              className={`${styles.stornoScopeBtn} ${styles.stornoAll}`}
              onClick={() => askOrderStorno("ALL")}
            >
              Storno sve
            </button>
          </div>
        )
      ) : confirming ? (
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
