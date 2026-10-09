import useTodaySales from "./hooks/useTodaySales";
import card from "./style/ProfilCard.module.css";
import styles from "./style/ShiftStats.module.css";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

// Promet prijavljenog konobara danas — red iz byWaiter današnjeg izvještaja.
export default function ShiftStats({ userId }) {
  const { data: report, isPending, error } = useTodaySales();
  const mine = report?.byWaiter?.find((row) => row.userId === userId);

  return (
    <section className={card.card}>
      <h3 className={card.cardTitle}>Moj promet danas</h3>
      {isPending ? (
        <p className={styles.message}>Učitavanje...</p>
      ) : error ? (
        <p className={styles.error}>{error.message}</p>
      ) : (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.value}>{mine?.orderCount ?? 0}</span>
            <span className={styles.label}>zatvorenih narudžbi</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{formatPrice(mine?.total ?? 0)}</span>
            <span className={styles.label}>promet</span>
          </div>
        </div>
      )}
    </section>
  );
}
