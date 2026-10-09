import styles from "./style/Drinks.module.css";
import { useState, useContext } from "react";

import useDrink from "./hooks/useDrink.js";
import { OrderContext } from "./context/OrderContext.jsx";
import useDrinkCat from "./hooks/useDrinkCat.js";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

export default function Drinks() {
  const { data: tabs = [], isPendingCat, errorCat } = useDrinkCat();
  console.log(tabs);
  const { data: drinks = [], isPending, error } = useDrink();
  const { addItemToOrder } = useContext(OrderContext);
  const [activeTab, setActiveTab] = useState("SOKOVI");
  const countOf = (value) => drinks.filter((d) => d.category === value).length;
  const visibleDrinks = drinks.filter((d) => d.category === activeTab);

  function handleAddDrink(drink) {
    addItemToOrder({ item: drink, type: "DRINK" });
  }
  if (isPendingCat) return <p className={styles.info}>Učitavanje…</p>;
  if (errorCat) return <p className={styles.info}>{errorCat.message}</p>;
  if (isPending) return <p className={styles.info}>Učitavanje…</p>;
  if (error) return <p className={styles.info}>{error.message}</p>;

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
