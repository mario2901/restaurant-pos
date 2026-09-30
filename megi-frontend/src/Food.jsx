import styles from "./style/Food.module.css";
import { useContext, useState } from "react";
import OrderItem from "./OrderItem.jsx";
import useFood from "./hooks/useFood.js";
import useAddons from "./hooks/useAddons.js";
import { OrderContext } from "./context/OrderContext.jsx";

const MAIN_CATEGORIES = ["Pizza", "Roštilj", "Doručak", "Salata"];
const TABS = [...MAIN_CATEGORIES, "Ostalo"];
const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;
const tabOf = (item) =>
  MAIN_CATEGORIES.includes(item.category) ? item.category : "Ostalo";

export default function Food() {
  const [activeTab, setActiveTab] = useState("Pizza");
  const [selectedItem, setSelectedItem] = useState(null);
  const { addItemToOrder } = useContext(OrderContext);
  const { data: food = [], isPending, error } = useFood();
  const { data: addons = [], isPending: addonsPending } = useAddons();

  if (isPending) return <p>Učitavanje…</p>;
  if (error) return <p>{error.message}</p>;

  const visibleFood = food.filter((item) => tabOf(item) === activeTab);
  function handleAddAddon(addon) {
    addItemToOrder({ item: addon, type: "ADDON" });
  }
  return (
    <div>
      {selectedItem && (
        <OrderItem
          key={`${selectedItem.kind}-${selectedItem.id}`}
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
        />
      )}

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

      <div className={styles.layout}>
        {/* LIJEVO: jela */}
        <section>
          {visibleFood.length === 0 ? (
            <p className={styles.empty}>Nema jela u ovoj kategoriji.</p>
          ) : (
            <div className={styles.grid}>
              {visibleFood.map((item) => (
                <button
                  key={`food-${item.id}`}
                  className={styles.card}
                  onClick={() => setSelectedItem({ ...item, kind: "food" })}
                >
                  <h3 className={styles.name}>{item.name}</h3>
                  {item.description && (
                    <p className={styles.description}>{item.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.addonsPanel}>
          <h4 className={styles.addonsTitle}>
            Prilozi <span className={styles.count}>{addons.length}</span>
          </h4>

          {addonsPending ? (
            <p className={styles.empty}>Učitavanje…</p>
          ) : addons.length === 0 ? (
            <p className={styles.empty}>Nema priloga.</p>
          ) : (
            <div className={styles.addonsList}>
              {addons.map((addon) => (
                <button
                  key={`addon-${addon.id}`}
                  className={styles.addon}
                  onClick={() => handleAddAddon(addon)}
                >
                  {addon.name}
                  <span>{formatPrice(addon.price)}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
