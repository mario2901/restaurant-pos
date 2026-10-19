import styles from "../style/AdminReports.module.css";
import { formatPrice } from "../data/menu";

function Stat({ label, value, sub }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

/** Tablica artikala: naziv, komada, iznos. */
export function ItemsTable({ title, rows, empty, danger = false }) {
  return (
    <section className={styles.block}>
      <h4 className={styles.blockTitle}>{title}</h4>
      {rows.length === 0 ? (
        <p className={styles.muted}>{empty}</p>
      ) : (
        <table className={`${styles.table} ${danger ? styles.tableDanger : ""}`}>
          <thead>
            <tr>
              <th>Artikl</th>
              <th className={styles.num}>Kom</th>
              <th className={styles.num}>Iznos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className={styles.num}>{row.quantity}</td>
                <td className={styles.num}>{formatPrice(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** Dnevni promet (SalesReport): samo zatvorene narudžbe, storno odvojeno. */
export default function SalesReportView({ report }) {
  const drinks = report.drinksIncluded !== false;
  return (
    <>
      {!drinks && (
        <p className={styles.notice}>
          Obračun pića je isključen — piće nije uključeno u promet ni artikle.
        </p>
      )}
      <div className={styles.stats}>
        <Stat
          label="Ukupan promet"
          value={formatPrice(report.total)}
          sub={`${report.orderCount} narudžbi · prosjek ${formatPrice(report.averageOrder)}`}
        />
        <Stat
          label="Restoran (stolovi + za ponijeti)"
          value={formatPrice(report.dineInTotal)}
          sub={`${report.dineInCount} narudžbi`}
        />
        <Stat
          label="Dostava"
          value={formatPrice(report.deliveryTotal)}
          sub={`${report.deliveryCount} narudžbi`}
        />
      </div>

      <div className={styles.stats}>
        <Stat label="Hrana" value={formatPrice(report.foodTotal)} />
        {drinks && <Stat label="Piće" value={formatPrice(report.drinkTotal)} />}
        <Stat label="Prilozi" value={formatPrice(report.addonTotal)} />
        <Stat
          label="Storno"
          value={formatPrice(report.stornoTotal)}
          sub={`${report.stornoQuantity} kom · nije u prometu`}
        />
      </div>

      <section className={styles.block}>
        <h4 className={styles.blockTitle}>Po konobaru</h4>
        {report.byWaiter.length === 0 ? (
          <p className={styles.muted}>Nema zatvorenih narudžbi.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Konobar</th>
                <th className={styles.num}>Narudžbi</th>
                <th className={styles.num}>Promet</th>
              </tr>
            </thead>
            <tbody>
              {report.byWaiter.map((w) => (
                <tr key={w.userId ?? w.name}>
                  <td>{w.name}</td>
                  <td className={styles.num}>{w.orderCount}</td>
                  <td className={styles.num}>{formatPrice(w.total)}</td>
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
