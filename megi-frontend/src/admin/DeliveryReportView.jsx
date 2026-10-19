import styles from "../style/AdminReports.module.css";
import { formatPrice } from "../data/menu";
import { formatTime } from "../data/dates";
import { ItemsTable } from "./SalesReportView";

const STATUS_LABEL = { NEW: "Otvorena", DONE: "Zatvorena", CANCELED: "Otkazana" };

/** Dostava za dan (DeliveryReport): promet zatvorenih + upozorenje za otvorene. */
export default function DeliveryReportView({ report }) {
  const drinks = report.drinksIncluded !== false;
  return (
    <>
      {!drinks && (
        <p className={styles.notice}>
          Obračun pića je isključen — piće nije uključeno u promet ni artikle.
        </p>
      )}
      {report.openOrderCount > 0 && (
        <p className={styles.warning}>
          {report.openOrderCount} dostava još nije zatvoreno (
          {formatPrice(report.openTotal)}) — nisu uključene u promet.
        </p>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatPrice(report.total)}</span>
          <span className={styles.statLabel}>Promet dostave</span>
          <span className={styles.statSub}>
            {report.orderCount} dostava · prosjek{" "}
            {formatPrice(report.averageOrder)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatPrice(report.foodTotal)}
          </span>
          <span className={styles.statLabel}>Hrana</span>
        </div>
        {drinks && (
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {formatPrice(report.drinkTotal)}
            </span>
            <span className={styles.statLabel}>Piće</span>
          </div>
        )}
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatPrice(report.stornoTotal)}
          </span>
          <span className={styles.statLabel}>Storno</span>
          <span className={styles.statSub}>{report.stornoQuantity} kom</span>
        </div>
      </div>

      <section className={styles.block}>
        <h4 className={styles.blockTitle}>Dostave</h4>
        {report.orders.length === 0 ? (
          <p className={styles.muted}>Nema dostava za ovaj dan.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Otvorena</th>
                <th>Zatvorena</th>
                <th>Konobar</th>
                <th>Status</th>
                <th className={styles.num}>Iznos</th>
              </tr>
            </thead>
            <tbody>
              {report.orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{formatTime(o.createdAt)}</td>
                  <td>{formatTime(o.closedAt)}</td>
                  <td>{o.userName ?? "–"}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        styles[`status${o.status}`] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className={styles.num}>{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className={styles.columns}>
        <ItemsTable
          title="Prodani artikli"
          rows={report.topItems}
          empty="Nema prodanih artikala."
        />
        <ItemsTable
          title="Stornirano"
          rows={report.stornoItems}
          empty="Nema storna."
          danger
        />
      </div>
    </>
  );
}
