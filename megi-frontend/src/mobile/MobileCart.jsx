import styles from "../style/Mobile.module.css";
import useOrderForm, { ORDER_NOTE_MAX } from "../hooks/useOrderForm.js";
import useOrders from "../hooks/useOrders.js";
import { formatPrice } from "../data/menu.js";
import { BackIcon, MinusIcon, PlusIcon, PrinterIcon } from "./icons.jsx";

/** Stavke koje su već na postojećoj narudžbi ("Dodaj još"), bez storniranih. */
function useSentItems(orderId) {
  const { data: orders = [] } = useOrders();
  if (!orderId) return [];
  const order = orders.find((o) => o.id === orderId);
  return (order?.items ?? [])
    .map((i) => ({ ...i, active: i.quantity - (i.stornoQuantity ?? 0) }))
    .filter((i) => i.status !== "CANCELLED" && i.active > 0);
}

/** Mobitel · Košarica: količine, napomena dostave, "Već poslano", Naruči i isprintaj. */
export default function MobileCart({ table, onBack, onSent }) {
  const orderId = table.orderId;
  const {
    items,
    totalPrice,
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
    send,
    clear,
    updateItemQuantity,
    removeItemFromOrder,
  } = useOrderForm({ table, orderId, onSent });
  const sent = useSentItems(orderId);

  return (
    <div className={styles.screen}>
      <header className={styles.cartHeader}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onBack}
          aria-label="Natrag na meni"
        >
          <BackIcon />
        </button>
        <div className={styles.headTitles}>
          <h1 className={styles.headTitle}>Narudžba · {title}</h1>
          <span className={styles.headSub}>
            {orderId ? `Dodaj još na #${orderId}` : "Nova narudžba"}
          </span>
        </div>
        {!isEmpty && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clear}
            disabled={isPending}
          >
            Očisti
          </button>
        )}
      </header>

      <div className={styles.scroll}>
        <div className={styles.cartBody}>
          {isEmpty ? (
            <div className={styles.emptyCart}>
              <p>Košarica je prazna.</p>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={onBack}
              >
                Natrag na meni
              </button>
            </div>
          ) : (
            <>
              <h2 className={styles.sectionLabel}>Novo · ide u kuhinju</h2>
              {items.map((line) => (
                <article key={line.lineId} className={styles.itemCard}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>
                        {line.name}
                        {line.size && (
                          <span className={styles.itemSize}>
                            {" "}
                            · {line.size}
                          </span>
                        )}
                      </h3>
                      {line.options?.length > 0 && (
                        <span className={styles.itemOptions}>
                          + {line.options.map((o) => o.name).join(", ")}
                        </span>
                      )}
                      {line.note && (
                        <span className={styles.itemNote}>{line.note}</span>
                      )}
                    </div>
                    <span className={styles.itemTotal}>
                      {formatPrice(line.unitPrice * line.amount)}
                    </span>
                  </div>

                  <div className={styles.itemControls}>
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        className={styles.stepBtn}
                        onClick={() => updateItemQuantity(line.lineId, -1)}
                        disabled={isPending}
                        aria-label="Smanji količinu"
                      >
                        <MinusIcon />
                      </button>
                      <span className={styles.stepQty}>{line.amount}</span>
                      <button
                        type="button"
                        className={styles.stepBtn}
                        onClick={() => updateItemQuantity(line.lineId, 1)}
                        disabled={isPending}
                        aria-label="Povećaj količinu"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => removeItemFromOrder(line.lineId)}
                      disabled={isPending}
                    >
                      Ukloni
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}

          {hasNote && (
            <label className={styles.noteField}>
              <span className={styles.noteLabel}>
                {noteLabel}
                <span>
                  {note.length}/{ORDER_NOTE_MAX}
                </span>
              </span>
              <input
                type="text"
                className={styles.noteInput}
                value={note}
                maxLength={ORDER_NOTE_MAX}
                onChange={(e) => setNote(e.target.value)}
                placeholder={notePlaceholder}
                disabled={isPending}
              />
            </label>
          )}

          {sent.length > 0 && (
            <>
              <h2 className={styles.sectionLabel}>Već poslano</h2>
              <div className={styles.sentBox}>
                {sent.map((i) => (
                  <div key={i.id} className={styles.sentRow}>
                    <span>
                      {i.active}× {i.name}
                      {i.detail ? ` · ${i.detail}` : ""}
                    </span>
                    <span>{formatPrice(i.lineTotal ?? 0)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <footer className={styles.cartFooter}>
        {isError && <p className={styles.footerError}>{error.message}</p>}
        <div className={styles.footerRow}>
          <span className={styles.footerLabel}>Novo u ovoj narudžbi</span>
          <span className={styles.footerTotal}>{formatPrice(totalPrice)}</span>
        </div>
        <button
          type="button"
          className={styles.sendBtn}
          onClick={send}
          disabled={!canSend}
        >
          <PrinterIcon />
          {isPending ? "Šaljem…" : "Naruči i isprintaj"}
        </button>
      </footer>
    </div>
  );
}
