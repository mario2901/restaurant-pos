import { useContext } from "react";
import style from "./style/Order.module.css";
import { OrderContext } from "./context/OrderContext";
import useSubmitOrder from "./hooks/useSubmit";
import { toSubmitRequest } from "./data/api";
const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

export default function Order({ table, userId = 1, orderId, onSent }) {
  const {
    items,
    totalPrice,
    totalCount,
    updateItemQuantity,
    removeItemFromOrder,
    clearOrder,
  } = useContext(OrderContext);

  const { mutate, isPending, isError, error, reset } = useSubmitOrder();
  const isEmpty = items.length === 0;
  const tableLabel = table?.label;
  const canSend = !isEmpty && !isPending && tableLabel && userId;

  function handleSend() {
    mutate(toSubmitRequest({ items, table: tableLabel, userId, orderId }), {
      onSuccess: (result) => {
        // result = { order: OrderResponse, tickets: [Ticket] }
        clearOrder();
        onSent?.(result);
      },
    });
  }

  function handleClear() {
    clearOrder();
    reset();
  }

  return (
    <div className={style.order}>
      <div className={style.header}>
        <h3 className={style.title}>
          {tableLabel === "DOSTAVA"
            ? "Dostava"
            : tableLabel === "PONIJETI"
              ? "Za ponijeti"
              : `Stol ${tableLabel ?? ""}`}
        </h3>
        {!isEmpty && <span className={style.count}>{totalCount}</span>}
      </div>

      {isEmpty ? (
        <p className={style.empty}>Narudžba je prazna.</p>
      ) : (
        <ul className={style.list}>
          {items.map((line) => (
            <li key={line.lineId} className={style.item}>
              <div className={style.info}>
                <span className={style.name}>{line.name}</span>
                {line.size && <span className={style.size}>{line.size}</span>}

                {line.options?.length > 0 && (
                  <div className={style.options}>
                    + {line.options.map((o) => o.name).join(", ")}
                  </div>
                )}

                {line.note && <div className={style.note}>{line.note}</div>}
              </div>

              <span className={style.price}>
                {formatPrice(line.unitPrice * line.amount)}
              </span>

              <div className={style.controls}>
                <div className={style.stepper}>
                  <button
                    type="button"
                    className={style.stepBtn}
                    onClick={() => updateItemQuantity(line.lineId, -1)}
                    disabled={isPending}
                    aria-label="Smanji količinu"
                  >
                    &minus;
                  </button>
                  <span className={style.qty}>{line.amount}</span>
                  <button
                    type="button"
                    className={style.stepBtn}
                    onClick={() => updateItemQuantity(line.lineId, 1)}
                    disabled={isPending}
                    aria-label="Povećaj količinu"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className={style.removeBtn}
                  onClick={() => removeItemFromOrder(line.lineId)}
                  disabled={isPending}
                >
                  Ukloni
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={style.footer}>
        {isError && <p className={style.error}>{error.message}</p>}

        <div className={style.totalRow}>
          <span className={style.totalLabel}>Ukupno</span>
          <span className={style.totalValue}>{formatPrice(totalPrice)}</span>
        </div>

        <div className={style.actions}>
          <button
            type="button"
            className={style.clearBtn}
            onClick={handleClear}
            disabled={isEmpty || isPending}
          >
            Očisti
          </button>
          <button
            type="button"
            className={style.sendBtn}
            onClick={handleSend}
            disabled={!canSend}
          >
            {isPending ? "Šaljem..." : "Naruči"}
          </button>
        </div>
      </div>
    </div>
  );
}
