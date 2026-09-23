import styles from "./style/Food.module.css";
import { useState } from "react";
import OrderItem from "./OrderItem.jsx";
import useFood from "./hooks/useFood.js";

const MAIN_CATEGORIES = ["Pizza", "Roštilj", "Doručak"];
const TABS = [...MAIN_CATEGORIES, "Ostalo"];

const tabOf = (item) =>
  MAIN_CATEGORIES.includes(item.category) ? item.category : "Ostalo";

export default function Food() {
  const [activeTab, setActiveTab] = useState("Pizza");
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: food = [], isPending, error } = useFood();

  function handleItem() {
    setSelectedItem(null);
  }
  console.log(food);
  if (isPending) return <p>Učitavanje…</p>;
  if (error) return <p>{error.message}</p>;

  const visibleFood = food.filter((item) => tabOf(item) === activeTab);

  if (error) return <p>{error}</p>;

  return (
    <div>
      {selectedItem && (
        <OrderItem
          key={selectedItem.id}
          item={selectedItem}
          onBack={handleItem}
        />
      )}
      {error && <p>{error}</p>}

      <div className={styles.categoryFilter}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}{" "}
            <span className={styles.count}>
              {food.filter((item) => tabOf(item) === tab).length}
            </span>
          </button>
        ))}
      </div>

      {visibleFood?.length === 0 ? (
        <p>Nema jela u ovoj kategoriji.</p>
      ) : (
        <div className={styles.grid}>
          {visibleFood?.map((item) => (
            <button
              key={item.id}
              className={styles.card}
              onClick={() => setSelectedItem(item)}
            >
              <h3 className={styles.name}>{item.name}</h3>
              {item.description && (
                <p className={styles.description}>{item.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
