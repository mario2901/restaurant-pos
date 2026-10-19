import styles from "./style/Admin.module.css";
import AdminFood from "./admin/AdminFood";
import AdminDrinks from "./admin/AdminDrinks";
import AdminReports from "./admin/AdminReports";
import AdminInventory from "./admin/AdminInventory";
import AdminPin from "./admin/AdminPin";
import AdminSettings from "./admin/AdminSettings";
import Users from "./Users";
import { useState } from "react";
import { useLogout } from "./hooks/useLogin";
import { TbArrowLeft, TbLogout } from "react-icons/tb";
import { useNavigate } from "react-router";

const NAV_ITEMS = [
  { key: "food", label: "Jela", Component: AdminFood },
  { key: "drink", label: "Pice", Component: AdminDrinks },
  { key: "inventory", label: "Inventura", Component: AdminInventory },
  { key: "users", label: "Konobar", Component: Users },
  { key: "reports", label: "Izvještaji", Component: AdminReports },
  { key: "settings", label: "Postavke", Component: AdminSettings },
  { key: "pin", label: "Promjena PIN-a", Component: AdminPin },
];

export default function Admin() {
  const [activeKey, setActiveKey] = useState(NAV_ITEMS[0].key);
  const logout = useLogout();
  const navigate = useNavigate();
  const active = NAV_ITEMS.find((item) => item.key === activeKey);
  const ActiveComponent = active?.Component;
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => navigate("/")}
          >
            <TbArrowLeft size={18} />
            Stolovi
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.logout}`}
            onClick={logout}
          >
            <TbLogout size={18} />
            Odjava
          </button>
        </div>

        <h3 className={styles.brand}>Megxxxon Admincic</h3>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className={`${styles.link} ${
                item.key === activeKey ? styles.active : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <p>Odaberi stavku iz izbornika.</p>
        )}
      </main>
    </div>
  );
}
