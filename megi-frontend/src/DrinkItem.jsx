import styles from "./style/DrinkItem.module.css";
import useDrinkCat from "./hooks/useDrinkCat";
import useDrink from "./hooks/useDrink";
import { useState } from "react";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

/**
 * Tabovi kategorija + mreža pića. Koristi se na konobarskom meniju (Drinks)
 * i na stranici zalihe (DrinksStocks).
 *
 * @param handleAddDrink  klik na piće
 * @param selectedId      id odabranog pića (istaknuta kartica), opcionalno
 * @param query           tekst pretrage po nazivu, opcionalno
 * @param lowThreshold    do koliko komada je piće "pri kraju"
 * @param compact         bez vanjskog paddinga, tabovi lijevo (za stranicu zalihe)
 * @param showAll         Admin: i pića skinuta s karte (zatamnjena)
 * @param searchAll       pretraga kroz sve kategorije (mobitel); kategorije se tada sakriju
 */
export default function DrinkItem({
  handleAddDrink,
  selectedId = null,
  query = "",
  lowThreshold = 5,
  compact = false,
  showAll = false,
  searchAll = false,
}) {
  const {
    data: tabs = [],
    isPending: isPendingCat,
    error: errorCat,
  } = useDrinkCat();
  const { data: drinks = [], isPending, error } = useDrink({ all: showAll });
  const [activeTab, setActiveTab] = useState("SOKOVI");

  const q = query.trim().toLowerCase();
  const countOf = (value) => drinks.filter((d) => d.category === value).length;
  const acrossAll = searchAll && !!q;
  const visibleDrinks = drinks.filter(
    (d) =>
      (acrossAll || d.category === activeTab) &&
      (!q || d.name.toLowerCase().includes(q)),
  );

  const stockInfo = (stock) => {
    if (stock <= 0) return { cls: styles.out, text: "Nema na stanju" };
    if (stock <= lowThreshold)
      return { cls: styles.low, text: `${stock} kom · pri kraju` };
    return { cls: styles.ok, text: `${stock} kom` };
  };

  if (isPendingCat || isPending)
    return <p className={styles.info}>Učitavanje…</p>;
  if (errorCat) return <p className={styles.info}>{errorCat.message}</p>;
  if (error) return <p className={styles.info}>{error.message}</p>;

  return (
    <div className={compact ? styles.compact : undefined}>
      {!acrossAll && (
        <nav className={styles.categoryFilter} aria-label="Kategorije pića">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`${styles.tab} ${
                tab.value === activeTab ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              <span className={styles.count}>{countOf(tab.value)}</span>
            </button>
          ))}
        </nav>
      )}

      {visibleDrinks.length === 0 ? (
        <p className={styles.info}>
          {q
            ? "Nema pića koje odgovara pretrazi."
            : "Nema pića u ovoj kategoriji."}
        </p>
      ) : (
        <div className={styles.grid}>
          {visibleDrinks.map((drink) => {
            const info = stockInfo(drink.stock);
            const isSelected = drink.id === selectedId;
            const unavailable = drink.available === false;
            return (
              <button
                key={drink.id}
                type="button"
                className={`${styles.card} ${isSelected ? styles.selected : ""} ${
                  unavailable ? styles.unavailable : ""
                }`}
                aria-pressed={selectedId !== null ? isSelected : undefined}
                onClick={() => handleAddDrink?.(drink)}
              >
                <h3 className={styles.name}>{drink.name}</h3>
                <span className={styles.price}>{formatPrice(drink.price)}</span>
                <span className={`${styles.quantity} ${info.cls}`}>
                  {unavailable ? "Skinuto s karte" : info.text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
