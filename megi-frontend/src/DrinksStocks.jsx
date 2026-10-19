import styles from "./style/DrinksStocks.module.css";
import { TbArrowLeft } from "react-icons/tb";

import DrinkItem from "./DrinkItem";
import { useState } from "react";
import useAddStock from "./hooks/useAddStock";
import useDrink from "./hooks/useDrink";
import useDrinkCat from "./hooks/useDrinkCat";
import { useNavigate } from "react-router";

const QUICK_AMOUNTS = [12, 24, 48];
const LOW_STOCK = 5;

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const nowTime = () =>
  new Date().toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function stockLevel(stock) {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK) return "low";
  return "ok";
}

export default function DrinksStocks() {
  const { data: drinks = [] } = useDrink();
  const { data: categories = [] } = useDrinkCat();
  const addStock = useAddStock();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [quant, setQuant] = useState("");
  const [query, setQuery] = useState("");
  const [log, setLog] = useState([]);

  // piće se uvijek čita iz keša, pa nakon dopune odmah ima novo stanje
  const selected = drinks.find((d) => d.id === selectedId) ?? null;
  const amount = Number.parseInt(quant, 10);
  const isValid = Number.isInteger(amount) && amount > 0;
  const lowCount = drinks.filter((d) => d.stock <= LOW_STOCK).length;
  const categoryLabel = selected
    ? (categories.find((c) => c.value === selected.category)?.label ?? "")
    : "";

  function clearStatus() {
    if (!addStock.isIdle) addStock.reset();
  }

  function selectDrink(drink) {
    setSelectedId(drink.id);
    setQuant("");
    clearStatus();
  }

  function setAmount(value) {
    setQuant(value > 0 ? String(value) : "");
    clearStatus();
  }

  function changeBy(delta) {
    setAmount((Number.isInteger(amount) ? amount : 0) + delta);
  }

  function handleStock() {
    if (!selected || !isValid || addStock.isPending) return;

    addStock.mutate(
      { id: selected.id, amount },
      {
        onSuccess: (updated) => {
          setQuant("");
          setLog((prev) =>
            [
              {
                key: `${updated.id}-${Date.now()}`,
                name: updated.name,
                amount,
                newStock: updated.stock,
                time: nowTime(),
              },
              ...prev,
            ].slice(0, 5),
          );
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate("/profil")}
        >
          <TbArrowLeft size={18} />
          Nazad
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate("/")}
        >
          Stolovi
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Zaliha pića</h1>
        </div>
        <div className={styles.headerTools}>
          {lowCount > 0 && (
            <span className={styles.lowBadge}>
              {lowCount} {lowCount === 1 ? "piće" : "pića"} pri kraju
            </span>
          )}
          <label htmlFor="drink-search" className={styles.srOnly}>
            Pretraži pića
          </label>
          <input
            id="drink-search"
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
            handleAddDrink={selectDrink}
            selectedId={selectedId}
            query={query}
            lowThreshold={LOW_STOCK}
            compact
          />
        </section>

        <aside className={styles.panel} aria-label="Dopuna zalihe">
          {!selected ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Odaberi piće</p>
              <p className={styles.emptyText}>
                Klikni na piće s popisa da dopuniš zalihu.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.panelHead}>
                <span className={styles.eyebrow}>Dopuna zalihe</span>
                <h2 className={styles.panelTitle}>{selected.name}</h2>
                <span className={styles.panelMeta}>
                  {categoryLabel && `${categoryLabel} · `}
                  {formatPrice(selected.price)}
                </span>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Trenutno stanje</span>
                  <span
                    className={`${styles.statValue} ${styles[stockLevel(selected.stock)]}`}
                  >
                    {selected.stock} <small>kom</small>
                  </span>
                </div>
                <div className={`${styles.stat} ${styles.statNext}`}>
                  <span className={styles.statLabel}>Nakon dopune</span>
                  <span className={styles.statValue}>
                    {selected.stock + (isValid ? amount : 0)} <small>kom</small>
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="stock-amount" className={styles.fieldLabel}>
                  Količina koja je stigla
                </label>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => changeBy(-1)}
                    disabled={!isValid}
                    aria-label="Smanji za 1"
                  >
                    −
                  </button>
                  <input
                    id="stock-amount"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    className={styles.amountInput}
                    placeholder="0"
                    value={quant}
                    onChange={(e) => {
                      setQuant(e.target.value);
                      clearStatus();
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleStock()}
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
                <div className={styles.quick}>
                  {QUICK_AMOUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.chip} ${amount === n ? styles.chipActive : ""}`}
                      onClick={() => setAmount(n)}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setAmount(0)}
                  disabled={!quant}
                >
                  Poništi
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={handleStock}
                  disabled={!isValid || addStock.isPending}
                >
                  {addStock.isPending
                    ? "Spremanje…"
                    : isValid
                      ? `Dopuni zalihu (+${amount})`
                      : "Upiši količinu"}
                </button>
              </div>

              {addStock.isError && (
                <p className={styles.error} role="alert">
                  {addStock.error.message}
                </p>
              )}
              {addStock.isSuccess && (
                <p className={styles.success} role="status">
                  Zaliha dopunjena.
                </p>
              )}
            </>
          )}

          <div className={styles.divider} />

          <div className={styles.log}>
            <span className={styles.fieldLabel}>Zadnje dopune u smjeni</span>
            {log.length === 0 ? (
              <span className={styles.logEmpty}>
                Još nema dopuna u ovoj smjeni.
              </span>
            ) : (
              <ul className={styles.logList}>
                {log.map((entry) => (
                  <li key={entry.key} className={styles.logItem}>
                    <span className={styles.logText}>
                      <strong>{entry.name}</strong>
                      <span>
                        {entry.time} · novo stanje {entry.newStock} kom
                      </span>
                    </span>
                    <span className={styles.logAmount}>+{entry.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
