import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import FoodItem from "../FoodItem";
import FoodEditor from "./FoodEditor";
import AddonEditor from "./AddonEditor";

/**
 * Admin -> Jela: grid jela + prilozi (FoodItem bez naručivanja) i bočni panel.
 * panel: { type: "food" | "addon", id }   (id null = novo)
 */
export default function AdminFood() {
  const [panel, setPanel] = useState(null);
  const close = () => setPanel(null);

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <h2 className={styles.pageTitle}>Jela i prilozi</h2>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setPanel({ type: "food", id: null })}
            >
              + Novo jelo
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setPanel({ type: "addon", id: null })}
            >
              + Novi prilog
            </button>
          </div>
        </div>

        <FoodItem
          onEditFood={(food) => setPanel({ type: "food", id: food.id })}
          onEditAddon={(addon) => setPanel({ type: "addon", id: addon.id })}
          selectedFoodId={panel?.type === "food" ? panel.id : null}
          selectedAddonId={panel?.type === "addon" ? panel.id : null}
        />
      </div>

      <aside className={styles.panel}>
        {panel?.type === "food" && (
          <FoodEditor
            key={`food-${panel.id ?? "new"}`}
            foodId={panel.id}
            onClose={close}
            onCreated={(food) => setPanel({ type: "food", id: food.id })}
          />
        )}
        {panel?.type === "addon" && (
          <AddonEditor
            key={`addon-${panel.id ?? "new"}`}
            addonId={panel.id}
            onClose={close}
            onCreated={(addon) => setPanel({ type: "addon", id: addon.id })}
          />
        )}
        {!panel && (
          <p className={styles.placeholder}>
            Klikni jelo ili prilog za uređivanje, ili dodaj novo.
          </p>
        )}
      </aside>
    </div>
  );
}
