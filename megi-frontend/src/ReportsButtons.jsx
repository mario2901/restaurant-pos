import { TbChartLine, TbTruck, TbClock, TbGlass } from "react-icons/tb";
import styles from "./style/ReportsButtons.module.css";
import card from "./style/ProfilCard.module.css";
import { useContext } from "react";
import { OrderContext } from "./context/OrderContext.jsx";
import useReports from "./hooks/useReports.js";
import { reportToTickets } from "./data/reportTicket.js";
const reports = [
  { id: "dnevni", label: "Dnevni izvještaj", icon: TbChartLine },
  { id: "dostava", label: "Dostava", icon: TbTruck },
  { id: "presjek", label: "Presjek stanja", icon: TbClock },
  {
    id: "pica",
    label: "Stanje pića",
    icon: TbGlass,
    disabled: true,
    note: "Uskoro",
  },
];

export default function ReportButtons() {
  const { showTickets } = useContext(OrderContext);
  const todayMutation = useReports();
  function handleSelect(id) {
    if (id === "dnevni") {
      todayMutation.mutate(undefined, {
        onSuccess: (report) => showTickets(reportToTickets(report)),
      });
    }
    if (id === "dostava") {
      todayMutation.mutate(id, {
        onSuccess: (report) => showTickets(reportToTickets(report)),
      });
    }
  }
  return (
    <section className={card.card}>
      <h3 className={card.cardTitle}>Izvještaji</h3>

      <div className={styles.reportGrid}>
        {reports.map(({ id, label, icon: Icon, disabled, note }) => (
          <button
            key={id}
            type="button"
            className={styles.reportBtn}
            disabled={disabled}
            onClick={() => handleSelect(id)}
          >
            <Icon size={20} />
            <span className={styles.reportBtnText}>
              <span className={styles.reportBtnLabel}>{label}</span>
              {note && <span className={styles.reportBtnNote}>{note}</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
