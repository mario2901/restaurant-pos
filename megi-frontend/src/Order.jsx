import style from "./style/Order.module.css";
import useOrderForm, { ORDER_NOTE_MAX } from "./hooks/useOrderForm";
import { formatPrice } from "./data/menu";

export { ORDER_NOTE_MAX };

/** Košarica u desnoj traci (laptop i tablet). Mobitel ima MobileCart. */
export default function Order({ table, orderId, onSent }) {
  const {
    items,
    totalPrice,
    totalCount,
    isEmpty,
    title,
    hasNote,
    note,
    setNote,
    noteLabel,
    notePlaceholder,
    canSend,
    isPending,
    isError,
    error,
    send: handleSend,
    clear: handleClear,
    updateItemQuantity,
    removeItemFromOrder,
  } = useOrderForm({ table, orderId, onSent });

  return (
    <div className={style.order}>
      <div className={style.header}>
        <h3 className={style.title}>{title}</h3>
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
              {noteLabel}
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
              placeholder={notePlaceholder}
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
