import styles from "../style/Mobile.module.css";
import { GridIcon, ListIcon, UserIcon } from "./icons.jsx";

/**
 * Donja navigacija na mobitelu — zamjenjuje desnu traku i gumb "Profil" s laptopa.
 * @param view       "tables" | "orders"
 * @param openCount  broj otvorenih narudžbi (značka na "Narudžbe")
 */
export default function MobileNav({ view, onChange, openCount, onProfile }) {
  const item = (id, label, Icon, extra = null) => (
    <button
      type="button"
      className={`${styles.navItem} ${view === id ? styles.navActive : ""}`}
      aria-current={view === id ? "page" : undefined}
      onClick={() => onChange(id)}
    >
      <Icon />
      {label}
      {extra}
    </button>
  );

  return (
    <nav className={styles.nav} aria-label="Glavni izbornik">
      {item("tables", "Stolovi", GridIcon)}
      {item(
        "orders",
        "Narudžbe",
        ListIcon,
        openCount > 0 && (
          <span
            className={styles.navBadge}
            aria-label={`${openCount} otvorenih`}
          >
            {openCount > 99 ? "99+" : openCount}
          </span>
        ),
      )}
      <button type="button" className={styles.navItem} onClick={onProfile}>
        <UserIcon />
        Profil
      </button>
    </nav>
  );
}
