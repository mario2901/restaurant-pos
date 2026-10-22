import { useContext, useState } from "react";
import styles from "../style/Mobile.module.css";
import { OrderContext } from "../context/OrderContext.jsx";
import { REONS } from "../data/Tables.js";
import { formatPrice } from "../data/menu.js";
import { orderTitle } from "../hooks/useOrderForm.js";
import FoodItem from "../FoodItem.jsx";
import DrinkItem from "../DrinkItem.jsx";
import { BackIcon, CloseIcon, SearchIcon } from "./icons.jsx";

/** "Terasa · dodaješ na narudžbu #128" / "Nova narudžba" */
function subtitle(table) {
  const reon = REONS.find((r) => r.tables.some((t) => t.name === table.label));
  const what = table.orderId
    ? `dodaješ na narudžbu #${table.orderId}`
    : "nova narudžba";
  const text = [reon?.name, what].filter(Boolean).join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Mobitel · Meni: pretraga, Hrana / Piće, kategorije kao čipovi, plutajuća košarica. */
export default function MobileMenu({ table, onBack, onOpenCart }) {
  const { addItemToOrder, totalCount, totalPrice } = useContext(OrderContext);
  const [kind, setKind] = useState("hrana");
  const [query, setQuery] = useState("");

  function switchKind(next) {
    setKind(next);
    setQuery("");
  }

  return (
    <div className={styles.screen}>
      <header className={styles.menuHeader}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onBack}
          aria-label="Natrag na stolove"
        >
          <BackIcon />
        </button>
        <div className={styles.headTitles}>
          <h1 className={styles.headTitle}>{orderTitle(table.label)}</h1>
          <span className={styles.headSub}>{subtitle(table)}</span>
        </div>
        <div className={styles.kindSwitch} role="tablist" aria-label="Vrsta">
          {[
            ["hrana", "Hrana"],
            ["pice", "Piće"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={kind === id}
              className={`${styles.kindBtn} ${
                kind === id ? styles.kindActive : ""
              }`}
              onClick={() => switchKind(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.searchWrap}>
        <label className={styles.search}>
          <SearchIcon />
          <span className={styles.srOnly}>
            {kind === "hrana" ? "Pretraži jela" : "Pretraži piće"}
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={kind === "hrana" ? "Pretraži jela" : "Pretraži piće"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setQuery("")}
              aria-label="Obriši pretragu"
            >
              <CloseIcon />
            </button>
          )}
        </label>
      </div>

      <div className={styles.scroll}>
        <div
          className={`${styles.menuList} ${
            totalCount > 0 ? styles.menuListWithCart : ""
          }`}
        >
          {kind === "hrana" ? (
            <FoodItem
              orderable
              query={query}
              handleAddAddon={(addon) =>
                addItemToOrder({ item: addon, type: "ADDON" })
              }
            />
          ) : (
            <DrinkItem
              query={query}
              searchAll
              handleAddDrink={(drink) =>
                addItemToOrder({ item: drink, type: "DRINK" })
              }
            />
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <button type="button" className={styles.cartBar} onClick={onOpenCart}>
          <span className={styles.cartCount}>{totalCount}</span>
          <span className={styles.cartLabel}>Pregled narudžbe</span>
          <span className={styles.cartTotal}>{formatPrice(totalPrice)}</span>
        </button>
      )}
    </div>
  );
}
