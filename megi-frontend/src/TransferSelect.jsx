import { useMemo } from "react";
import useOrders from "./hooks/useOrders";
import { unutra, terasa, kat } from "./data/Tables.js";
import styles from "./style/OrderDetailsModal.module.css";

const REONS = [
  { id: "unutra", name: "Unutra", tables: unutra },
  { id: "terasa", name: "Terasa", tables: terasa },
  { id: "kat", name: "Kat", tables: kat },
];

// posebna vrijednost da se ne miješa s nazivom stola
const TAKEAWAY = "__PONIJETI__";

/**
 * Dropdown "Odaberi stol": "Za ponijeti" (samo kad narudžba već nije za ponijeti),
 * zatim samo slobodni stolovi po reonima.
 */
export default function TransferSelect({
  onMove,
  onTakeaway,
  disabled,
  showTakeaway = true,
}) {
  const { data: orders = [] } = useOrders();

  const freeReons = useMemo(() => {
    const occupied = new Set(
      orders.filter((o) => o.status === "NEW").map((o) => String(o.table)),
    );
    return REONS.map((r) => ({
      ...r,
      tables: r.tables.filter((t) => !occupied.has(String(t.name))),
    })).filter((r) => r.tables.length > 0);
  }, [orders]);

  function handleChange(e) {
    const value = e.target.value;
    if (!value) return;
    if (value === TAKEAWAY) onTakeaway();
    else onMove(value);
  }
  return (
    <select
      className={styles.transferSelect}
      value=""
      onChange={handleChange}
      disabled={disabled}
      autoFocus
      aria-label="Odaberi stol"
    >
      <option value="" disabled>
        Odaberi stol
      </option>
      {showTakeaway && <option value={TAKEAWAY}>Za ponijeti</option>}
      {freeReons.map((r) => (
        <optgroup key={r.id} label={r.name}>
          {r.tables.map((t) => (
            <option key={t.id} value={String(t.name)}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
