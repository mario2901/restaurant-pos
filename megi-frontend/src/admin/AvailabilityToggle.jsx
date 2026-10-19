import styles from "../style/AdminEditor.module.css";

/** Prekidač "Na meniju / Skinuto" — PATCH .../availability */
export default function AvailabilityToggle({ available, onToggle, isPending }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      className={`${styles.toggle} ${available ? styles.toggleOn : ""}`}
      onClick={onToggle}
      disabled={isPending}
    >
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
      {available ? "Na meniju" : "Skinuto s menija"}
    </button>
  );
}
