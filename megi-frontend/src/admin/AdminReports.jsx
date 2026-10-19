import { useContext, useState } from "react";
import styles from "../style/AdminReports.module.css";
import ReportCalendar from "./ReportCalendar";
import SalesReportView from "./SalesReportView";
import DeliveryReportView from "./DeliveryReportView";
import useDayReport from "../hooks/useDayReport";
import { OrderContext } from "../context/OrderContext";
import {
  deliveryReportToTickets,
  reportToTickets,
} from "../data/reportTicket";
import {
  addDays,
  formatDateKey,
  formatLongDate,
  todayKey,
} from "../data/dates";

const TABS = [
  { id: "promet", label: "Dnevni promet" },
  { id: "dostava", label: "Dostava" },
];

/** Admin -> Izvještaji: kalendar lijevo, izvještaj za odabrani dan desno. */
export default function AdminReports() {
  const [date, setDate] = useState(todayKey);
  const [tab, setTab] = useState("promet");
  const { showTickets } = useContext(OrderContext);
  const { data: report, isPending, error, isFetching } = useDayReport(date, tab);

  const today = todayKey();

  function handlePrint() {
    showTickets(
      tab === "dostava"
        ? deliveryReportToTickets(report, formatDateKey(date))
        : reportToTickets(report, `DNEVNI IZVJEŠTAJ ${formatDateKey(date)}`),
    );
  }

  return (
    <div className={styles.page}>
      <aside className={styles.side}>
        <h2 className={styles.pageTitle}>Izvještaji</h2>
        <ReportCalendar value={date} onChange={setDate} />
        <div className={styles.quick}>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => setDate(addDays(date, -1))}
          >
            ‹ Dan prije
          </button>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => setDate(today)}
            disabled={date === today}
          >
            Danas
          </button>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => setDate(addDays(date, 1))}
            disabled={date >= today}
          >
            Dan poslije ›
          </button>
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <h3 className={styles.dateTitle}>{formatLongDate(date)}</h3>
            {date === today && (
              <span className={styles.liveHint}>
                Današnji dan — broje se samo zatvorene narudžbe
              </span>
            )}
          </div>
          <div className={styles.headerActions}>
            <div className={styles.tabs} role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.printBtn}
              onClick={handlePrint}
              disabled={!report || isFetching}
            >
              Printaj
            </button>
          </div>
        </header>

        {isPending ? (
          <p className={styles.muted}>Učitavanje…</p>
        ) : error ? (
          <p className={styles.error}>{error.message}</p>
        ) : tab === "dostava" ? (
          <DeliveryReportView report={report} />
        ) : (
          <SalesReportView report={report} />
        )}
      </section>
    </div>
  );
}
