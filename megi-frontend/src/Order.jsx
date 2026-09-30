import { useContext, useState } from "react";
import style from "./style/Order.module.css";
import { OrderContext } from "./context/OrderContext";
import useSubmitOrder from "./hooks/useSubmit";
import { toSubmitRequest } from "./data/api";

const NOTE_TABLES = ["DOSTAVA", "PONIJETI"];
export const ORDER_NOTE_MAX = 120;

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

export default function Order({
  table,
  userId = 1,
  orderId,

  onSent,
}) {
  const {
    items,
    totalPrice,
    totalCount,
    updateItemQuantity,
    removeItemFromOrder,
    clearOrder,
    finishOrder,
  } = useContext(OrderContext);

  const { mutate, isPending, isError, error, reset } = useSubmitOrder();
  const isEmpty = items.length === 0;
  const tableLabel = table?.label;
  const hasNote = NOTE_TABLES.includes(tableLabel);
  // "Dodaj još" na postojeću dostavu: predpopuni njenu napomenu
  const [note, setNote] = useState(
    () => table?.orders?.find((o) => o.id === orderId)?.note ?? "",
  );
  const canSend = !isEmpty && !isPending && tableLabel && userId;

  function handleSend() {
    mutate(
      toSubmitRequest({
        items,
        table: tableLabel,
        userId,
        orderId,
        note: hasNote ? note : undefined,
      }),
      {
        onSuccess: (result) => {
          // result = { order: OrderResponse, tickets: [Ticket] }
          // Prvo tiketi (RightSideBar otvara pregled), pa povratak na stolove.
          onSent?.(result);
          finishOrder();
        },
      },
    );
  }

  function handleClear() {
    clearOrder();
    setNote("");
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
        {hasNote && (
          <label className={style.orderNote}>
            <span className={style.orderNoteLabel}>
              {tableLabel === "DOSTAVA" ? "Adresa / napomena" : "Ime / telefon"}
              <span className={style.orderNoteCount}>
                {note.length}/{ORDER_NOTE_MAX}
              </span>
            </span>
            <input
              type="text"
              className={style.orderNoteInput}
              value={note}
              maxLength={ORDER_NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                tableLabel === "DOSTAVA"
                  ? "npr. Adresa, 061 123 456"
                  : "npr. Ime, 063 111 222"
              }
              disabled={isPending}
            />
          </label>
        )}

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
