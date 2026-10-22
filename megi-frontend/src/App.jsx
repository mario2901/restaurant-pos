import styles from "./style/App.module.css";
import RightSideBar from "./RightSideBar";
import Tables from "./Tables.jsx";
import Menu from "./Menu.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";
import { useContext, useState } from "react";
import { OrderContext } from "./context/OrderContext.jsx";

import { useNavigate } from "react-router";
import { useMe } from "./hooks/useLogin.js";
import { useIsPhone } from "./hooks/useMediaQuery.js";
import MobileApp from "./mobile/MobileApp.jsx";

const targetName = (table) => {
  if (!table) return "stolove";
  if (table.label === "DOSTAVA") return "dostavu";
  if (table.label === "PONIJETI") return "za ponijeti";
  return `stol ${table.label}`;
};

export default function App() {
  const { data: user } = useMe();
  const [reon, setReon] = useState("unutra");
  // mobitel ima svoj raspored (mockup); tablet i laptop dijele ovaj ispod
  const isPhone = useIsPhone();

  const navigate = useNavigate();

  const {
    table,
    selectTable,
    totalCount,
    pendingTable,
    confirmTableChange,
    cancelTableChange,
  } = useContext(OrderContext);
  function handleProfil() {
    navigate(user?.role === "ADMIN" ? "/admin" : "/profil");
  }
  return (
    <div className={styles.app}>
      {isPhone ? (
        <MobileApp
          reon={reon}
          onReonChange={setReon}
          user={user}
          onProfile={handleProfil}
        />
      ) : (
        <div className={styles.global}>
          {!table && (
            <button className={styles.profil} onClick={handleProfil}>
              Profil
            </button>
          )}

          <main className={styles.main}>
            {table ? (
              <Menu table={table} onBack={() => selectTable(null)} />
            ) : (
              <Tables
                reon={reon}
                onReonChange={setReon}
                onSelectTable={selectTable}
              />
            )}
          </main>
          <RightSideBar />
        </div>
      )}

      <OrderDetailsModal
        isOpen={!!pendingTable}
        onClose={cancelTableChange}
        title="Narudžba nije poslana"
      >
        {pendingTable && (
          <div className={styles.confirm}>
            <p className={styles.confirmText}>
              U košarici {totalCount === 1 ? "je" : "su"}{" "}
              <strong>{totalCount}</strong>{" "}
              {totalCount === 1
                ? "stavka koja nije poslana"
                : "stavki koje nisu poslane"}
              . Ako odeš na {targetName(pendingTable.next)}, košarica se briše.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmSecondary}
                onClick={cancelTableChange}
                autoFocus
              >
                Ostani
              </button>
              <button
                type="button"
                className={styles.confirmDanger}
                onClick={confirmTableChange}
              >
                Odbaci narudžbu
              </button>
            </div>
          </div>
        )}
      </OrderDetailsModal>
    </div>
  );
}
