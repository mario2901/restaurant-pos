import styles from "./style/FoodItem.module.css";
import useFood from "./hooks/useFood.js";
import useAddons from "./hooks/useAddons.js";
import { useEffect, useRef, useState } from "react";
import OrderItem from "./OrderItem.jsx";
import { MAIN_FOOD_CATEGORIES, formatPrice } from "./data/menu.js";

const TABS = [...MAIN_FOOD_CATEGORIES, "Ostalo"];
const tabOf = (item) =>
  MAIN_FOOD_CATEGORIES.includes(item.category) ? item.category : "Ostalo";


function FoodCard({
  item,
  portion,
  orderable,
  onSelectPortion,
  onClose,
  onEdit,
  selected,
}) {
  const ref = useRef(null);
  const open = orderable && portion != null;

  
  useEffect(() => {
    if (open) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [open]);

  const portions = item.portions ?? [];
  const editable = !orderable && !!onEdit;

  return (
    <div
      ref={ref}
      className={`${styles.card} ${open ? styles.cardOpen : ""} ${
        editable ? styles.cardEditable : ""
      } ${selected ? styles.cardSelected : ""} ${
        item.available === false ? styles.cardUnavailable : ""
      }`}
      onClick={editable ? () => onEdit(item) : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={
        editable ? (e) => e.key === "Enter" && onEdit(item) : undefined
      }
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.name}>{item.name}</h3>
        {item.available === false && (
          <span className={styles.badge}>Skinuto</span>
        )}
        {open && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Zatvori"
          >
            &times;
          </button>
        )}
      </div>

      {item.description && (
        <p className={styles.description}>{item.description}</p>
      )}

      {portions.length === 0 ? (
        <p className={styles.empty}>Nema porcija.</p>
      ) : (
        <div className={styles.portions}>
          {portions.map((p) =>
            orderable ? (
              <button
                key={p.id}
                type="button"
                className={`${styles.portionBtn} ${
                  portion?.id === p.id ? styles.portionActive : ""
                }`}
                onClick={() => onSelectPortion(p)}
              >
                <span>{p.size}</span>
                <span className={styles.portionPrice}>
                  {formatPrice(p.price)}
                </span>
              </button>
            ) : (
              <div
                key={p.id}
                className={`${styles.portionBtn} ${styles.portionStatic}`}
              >
                <span>{p.size}</span>
                <span className={styles.portionPrice}>
                  {formatPrice(p.price)}
                </span>
              </div>
            ),
          )}
        </div>
      )}

      {open && <OrderItem item={item} portion={portion} onDone={onClose} />}
    </div>
  );
}

/**
 * orderable=true  -> Food (narudžba): samo dostupna jela, odabir porcije, prilozi u košaricu
 * orderable=false -> Admin: sva jela i prilozi (i skinuti s menija);
 *                    s onEditFood / onEditAddon klik otvara uređivanje
 */
export default function FoodItem({
  orderable = false,
  handleAddAddon,
  onEditFood,
  onEditAddon,
  selectedFoodId = null,
  selectedAddonId = null,
}) {
  const [activeTab, setActiveTab] = useState("Pizza");
  // otvorena kartica: { id, portion } — samo jedna u isto vrijeme
  const [selection, setSelection] = useState(null);
  const { data: food = [], isPending, error } = useFood({ all: !orderable });
  const { data: addons = [], isPending: addonsPending } = useAddons({
    all: !orderable,
  });

  if (isPending) return <p>Učitavanje…</p>;
  if (error) return <p>{error.message}</p>;

  const visibleFood = food.filter((item) => tabOf(item) === activeTab);

  function changeTab(tab) {
    setActiveTab(tab);
    setSelection(null);
  }

  return (
    <>
      <div className={styles.categoryFilter}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${tab === activeTab ? styles.tabActive : ""}`}
            onClick={() => changeTab(tab)}
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
                <FoodCard
                  key={`food-${item.id}`}
                  item={item}
                  orderable={orderable}
                  portion={selection?.id === item.id ? selection.portion : null}
                  onSelectPortion={(portion) =>
                    setSelection({ id: item.id, portion })
                  }
                  onClose={() => setSelection(null)}
                  onEdit={onEditFood}
                  selected={item.id === selectedFoodId}
                />
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
              {addons.map((addon) => {
                const unavailable = addon.available === false;
                if (orderable || onEditAddon) {
                  return (
                    <button
                      key={`addon-${addon.id}`}
                      className={`${styles.addon} ${
                        addon.id === selectedAddonId ? styles.addonSelected : ""
                      } ${unavailable ? styles.cardUnavailable : ""}`}
                      onClick={() =>
                        orderable
                          ? handleAddAddon?.(addon)
                          : onEditAddon(addon)
                      }
                    >
                      {addon.name}
                      <span>
                        {unavailable ? "Skinuto · " : ""}
                        {formatPrice(addon.price)}
                      </span>
                    </button>
                  );
                }
                return (
                  <div
                    key={`addon-${addon.id}`}
                    className={`${styles.addon} ${styles.addonStatic} ${
                      unavailable ? styles.cardUnavailable : ""
                    }`}
                  >
                    {addon.name}
                    <span>{formatPrice(addon.price)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
