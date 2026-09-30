import styles from "./style/Drinks.module.css";
import { useState, useContext } from "react";

import useDrink from "./hooks/useDrink.js";
import { OrderContext } from "./context/OrderContext.jsx";
// fallback ako /drinks/categories ne prođe — isti redoslijed kao enum na backendu
const FALLBACK_TABS = [
  { value: "ALKOHOLNA_PICA", label: "Alkoholna pića" },
  { value: "VINA", label: "Vina" },
  { value: "PIVA", label: "Piva" },
  { value: "SOKOVI", label: "Sokovi" },
  { value: "TOPLI_NAPITCI", label: "Topli napitci" },
];

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

export default function Drinks() {
  const [tabs, setTabs] = useState(FALLBACK_TABS);
  const [activeTab, setActiveTab] = useState(FALLBACK_TABS[0].value);

  const { data: drinks = [], isPending, error } = useDrink();
  const { addItemToOrder } = useContext(OrderContext);
  const countOf = (value) => drinks.filter((d) => d.category === value).length;
  const visibleDrinks = drinks.filter((d) => d.category === activeTab);

  function handleAddDrink(drink) {
    addItemToOrder({ item: drink, type: "DRINK" });
  }
  if (isPending) return <p className={styles.info}>Učitavanje…</p>;
  if (error) return <p className={styles.info}>{error}</p>;

  return (
    <div>
      <div className={styles.categoryFilter}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${
              tab.value === activeTab ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}{" "}
            <span className={styles.count}>{countOf(tab.value)}</span>
          </button>
        ))}
      </div>

      {visibleDrinks.length === 0 ? (
        <p className={styles.info}>Nema pića u ovoj kategoriji.</p>
      ) : (
        <div className={styles.grid}>
          {visibleDrinks.map((drink) => (
            <button
              key={drink.id}
              className={styles.card}
              onClick={() => handleAddDrink(drink)}
            >
              <h3 className={styles.name}>{drink.name}</h3>
              <span className={styles.price}>{formatPrice(drink.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
