import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import DrinkItem from "../DrinkItem";
import DrinkEditor from "./DrinkEditor";

/**
 * Admin -> Piće: sva pića (i skinuta s karte) + bočni panel.
 * panel: { id }   (id null = novo piće)
 */
export default function AdminDrinks() {
  const [panel, setPanel] = useState(null);
  const close = () => setPanel(null);

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <h2 className={styles.pageTitle}>Piće</h2>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setPanel({ id: null })}
            >
              + Novo piće
            </button>
          </div>
        </div>

        <DrinkItem
          showAll
          selectedId={panel?.id ?? null}
          handleAddDrink={(drink) => setPanel({ id: drink.id })}
        />
      </div>

      <aside className={styles.panel}>
        {panel ? (
          <DrinkEditor
            key={`drink-${panel.id ?? "new"}`}
            drinkId={panel.id}
            onClose={close}
            onCreated={(drink) => setPanel({ id: drink.id })}
          />
        ) : (
          <p className={styles.placeholder}>
            Klikni piće za uređivanje, ili dodaj novo.
          </p>
        )}
      </aside>
    </div>
  );
}
