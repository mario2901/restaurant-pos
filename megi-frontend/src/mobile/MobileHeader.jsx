import styles from "../style/Mobile.module.css";

/** Zaglavlje ekrana Stolovi / Narudžbe: naziv restorana, naslov i konobar. */
export default function MobileHeader({ title, user, onProfile }) {
  const name = user?.name?.trim() || "Konobar";
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageTitles}>
        <span className={styles.eyebrow}>Pizzeria Megi Dea</span>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <button type="button" className={styles.userPill} onClick={onProfile}>
        <span className={styles.avatar} aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
        <span>{name}</span>
      </button>
    </header>
  );
}
