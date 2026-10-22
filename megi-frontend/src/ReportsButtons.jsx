import { TbChartLine, TbTruck, TbClock, TbGlass } from "react-icons/tb";
import styles from "./style/ReportsButtons.module.css";
import card from "./style/ProfilCard.module.css";
import { useContext } from "react";
import { OrderContext } from "./context/OrderContext.jsx";
import useReports from "./hooks/useReports.js";
import {
  deliveryReportToTickets,
  reportToTickets,
} from "./data/reportTicket.js";
import { useNavigate } from "react-router";
import { useLogout } from "./hooks/useLogin.js";
const reports = [
  { id: "dnevni", label: "Dnevni izvještaj", icon: TbChartLine },
  { id: "dostava", label: "Dostava", icon: TbTruck },
  { id: "presjek", label: "Presjek stanja", icon: TbClock },
  {
    id: "pica",
    label: "Stanje pića",
    icon: TbGlass,
  },
];

export default function ReportButtons() {
  const { showTickets } = useContext(OrderContext);
  const todayMutation = useReports();
  const navigate = useNavigate();
  const logout = useLogout();
  function handleSelect(id) {
    if (id === "dnevni") {
      // Dnevni izvještaj = kraj smjene -> konobar se automatski odjavljuje.
      // Pregled tiketa je u RootLayout (iznad ruta), pa ostaje otvoren i na
      // ekranu za prijavu i izvještaj se normalno isprinta.
      todayMutation.mutate(undefined, {
        onSuccess: (report) => {
          showTickets(reportToTickets(report));
          logout();
        },
      });
    }
    // Dostava: konobar ostaje prijavljen (izvlači se tijekom dana)
    if (id === "dostava") {
      todayMutation.mutate(id, {
        onSuccess: (report) => showTickets(deliveryReportToTickets(report)),
      });
    }
    // Presjek stanja: promet do ovog trenutka, konobar ostaje prijavljen
    if (id === "presjek") {
      todayMutation.mutate(undefined, {
        onSuccess: (report) => {
          const time = new Date().toLocaleTimeString("hr-HR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          showTickets(reportToTickets(report, `PRESJEK STANJA ${time}`));
        },
      });
    }
    if (id === "pica") {
      navigate("/pice");
    }
  }
  return (
    <section className={`${card.card} ${styles.reports}`}>
      <h3 className={card.cardTitle}>Izvještaji</h3>

      <div className={styles.reportGrid}>
        {reports.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={styles.reportBtn}
            onClick={() => handleSelect(id)}
          >
            <Icon size={20} />
            <span className={styles.reportBtnText}>
              <span className={styles.reportBtnLabel}>{label}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
