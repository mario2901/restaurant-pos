import { useState } from "react";
import styles from "../style/DrinksStocks.module.css";
import inv from "../style/AdminInventory.module.css";
import DrinkItem from "../DrinkItem";
import useDrink from "../hooks/useDrink";
import useDrinkCat from "../hooks/useDrinkCat";
import useSetStock from "../hooks/useSetStock";
import { formatPrice } from "../data/menu";

const LOW_STOCK = 5;

const nowTime = () =>
  new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });

function stockLevel(stock) {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK) return "low";
  return "ok";
}

/** "+3" / "−2" / "0" */
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/**
 * Admin -> Inventura: odaberi piće, upiši prebrojano stanje, poravnaj.
 * Backend PUT /drinks/{id}/stock postavlja točno stanje (ne dodaje).
 * Prikazuje se i piće skinuto s karte — i ono se broji.
 */
export default function AdminInventory() {
  const { data: drinks = [] } = useDrink({ all: true });
  const { data: categories = [] } = useDrinkCat();
  const setStock = useSetStock();

  const [selectedId, setSelectedId] = useState(null);
  const [counted, setCounted] = useState("");
  const [query, setQuery] = useState("");
  const [log, setLog] = useState([]);

  const selected = drinks.find((d) => d.id === selectedId) ?? null;
  const amount = counted === "" ? NaN : Number(counted);
  const isValid = Number.isInteger(amount) && amount >= 0;
  const diff = selected && isValid ? amount - selected.stock : 0;
  const categoryLabel = selected
    ? (categories.find((c) => c.value === selected.category)?.label ?? "")
    : "";

  function clearStatus() {
    if (!setStock.isIdle) setStock.reset();
  }

  function selectDrink(drink) {
    setSelectedId(drink.id);
    setCounted("");
    clearStatus();
  }

  function changeBy(delta) {
    const base = isValid ? amount : (selected?.stock ?? 0);
    setCounted(String(Math.max(0, base + delta)));
    clearStatus();
  }

  function handleSave() {
    if (!selected || !isValid || setStock.isPending) return;
    const before = selected.stock;

    setStock.mutate(
      { id: selected.id, amount },
      {
        onSuccess: (updated) => {
          setCounted("");
          setLog((prev) =>
            [
              {
                key: `${updated.id}-${Date.now()}`,
                name: updated.name,
                before,
                after: updated.stock,
                time: nowTime(),
              },
              ...prev,
            ].slice(0, 10),
          );
        },
      },
    );
  }

  return (
    <div className={`${styles.page} ${inv.page}`}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Inventura pića</h1>
        </div>
        <div className={styles.headerTools}>
          <label htmlFor="inventory-search" className={styles.srOnly}>
            Pretraži pića
          </label>
          <input
            id="inventory-search"
            type="search"
            className={styles.search}
            placeholder="Pretraži piće…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.list} aria-label="Popis pića">
          <DrinkItem
            showAll
            handleAddDrink={selectDrink}
            selectedId={selectedId}
            query={query}
            lowThreshold={LOW_STOCK}
            compact
          />
        </section>

        <aside className={styles.panel} aria-label="Poravnanje stanja">
          {!selected ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Odaberi piće</p>
              <p className={styles.emptyText}>
                Klikni na piće i upiši stvarno prebrojano stanje.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.panelHead}>
                <span className={styles.eyebrow}>Inventura</span>
                <h2 className={styles.panelTitle}>{selected.name}</h2>
                <span className={styles.panelMeta}>
                  {categoryLabel && `${categoryLabel} · `}
                  {formatPrice(selected.price)}
                  {selected.available === false && " · skinuto s karte"}
                </span>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Stanje u programu</span>
                  <span
                    className={`${styles.statValue} ${styles[stockLevel(selected.stock)]}`}
                  >
                    {selected.stock} <small>kom</small>
                  </span>
                </div>
                <div className={`${styles.stat} ${styles.statNext}`}>
                  <span className={styles.statLabel}>Razlika</span>
                  <span
                    className={`${styles.statValue} ${
                      !isValid || diff === 0
                        ? ""
                        : diff < 0
                          ? inv.minus
                          : inv.plus
                    }`}
                  >
                    {isValid ? signed(diff) : "–"} <small>kom</small>
                  </span>
                  {isValid && diff !== 0 && (
                    <span className={inv.diffHint}>
                      {diff < 0 ? "manjak" : "višak"}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="inventory-amount" className={styles.fieldLabel}>
                  Stvarno stanje (prebrojano)
                </label>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => changeBy(-1)}
                    disabled={isValid && amount <= 0}
                    aria-label="Smanji za 1"
                  >
                    −
                  </button>
                  <input
                    id="inventory-amount"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className={styles.amountInput}
                    placeholder={String(selected.stock)}
                    value={counted}
                    onChange={(e) => {
                      setCounted(e.target.value.replace(/\D/g, ""));
                      clearStatus();
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => changeBy(1)}
                    aria-label="Povećaj za 1"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setCounted("");
                    clearStatus();
                  }}
                  disabled={!counted}
                >
                  Poništi
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={handleSave}
                  disabled={!isValid || setStock.isPending}
                >
                  {setStock.isPending
                    ? "Spremanje…"
                    : !isValid
                      ? "Upiši stanje"
                      : diff === 0
                        ? "Potvrdi stanje"
                        : `Poravnaj na ${amount} kom`}
                </button>
              </div>

              {setStock.isError && (
                <p className={styles.error} role="alert">
                  {setStock.error.message}
                </p>
              )}
              {setStock.isSuccess && (
                <p className={styles.success} role="status">
                  Stanje poravnato.
                </p>
              )}
            </>
          )}

          <div className={styles.divider} />

          <div className={styles.log}>
            <span className={styles.fieldLabel}>Poravnato u ovoj inventuri</span>
            {log.length === 0 ? (
              <span className={styles.logEmpty}>Još nema poravnanja.</span>
            ) : (
              <ul className={styles.logList}>
                {log.map((entry) => {
                  const d = entry.after - entry.before;
                  return (
                    <li key={entry.key} className={styles.logItem}>
                      <span className={styles.logText}>
                        <strong>{entry.name}</strong>
                        <span>
                          {entry.time} · {entry.before} → {entry.after} kom
                        </span>
                      </span>
                      <span
                        className={`${styles.logAmount} ${
                          d < 0 ? inv.minus : d > 0 ? inv.plus : inv.zero
                        }`}
                      >
                        {signed(d)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
