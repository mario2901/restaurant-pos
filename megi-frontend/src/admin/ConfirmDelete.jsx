import { useState } from "react";
import styles from "../style/AdminEditor.module.css";

/** "Obriši" u dva klika — prvi traži potvrdu, drugi briše. */
export default function ConfirmDelete({
  onConfirm,
  isPending = false,
  label = "Obriši",
  small = false,
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        className={`${styles.dangerGhost} ${small ? styles.small : ""}`}
        onClick={() => setAsking(true)}
        disabled={isPending}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={styles.confirmInline}>
      <button
        type="button"
        className={`${styles.danger} ${small ? styles.small : ""}`}
        onClick={() => onConfirm(() => setAsking(false))}
        disabled={isPending}
      >
        {isPending ? "Brišem…" : "Potvrdi"}
      </button>
      <button
        type="button"
        className={`${styles.ghost} ${small ? styles.small : ""}`}
        onClick={() => setAsking(false)}
        disabled={isPending}
      >
        Odustani
      </button>
    </span>
  );
}
