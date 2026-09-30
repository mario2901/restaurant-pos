import styles from "./style/App.module.css";
import RightSideBar from "./RightSideBar";
import Tables from "./Tables.jsx";
import Menu from "./Menu.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";
import TicketPreview from "./TicketPreview.jsx";
import { useContext, useState } from "react";
import { OrderContext } from "./context/OrderContext.jsx";

const targetName = (table) => {
  if (!table) return "stolove";
  if (table.label === "DOSTAVA") return "dostavu";
  if (table.label === "PONIJETI") return "za ponijeti";
  return `stol ${table.label}`;
};

export default function App() {
  const [reon, setReon] = useState("unutra");
  // Odabrani stol živi u OrderContext-u (zajedno s košaricom)
  const {
    table,
    selectTable,
    totalCount,
    pendingTable,
    confirmTableChange,
    cancelTableChange,
    tickets,
    closeTickets,
  } = useContext(OrderContext);

  return (
    <div className={styles.app}>
      <div className={styles.global}>
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

      <OrderDetailsModal
        isOpen={!!tickets}
        onClose={closeTickets}
        title="Tiketi za print"
      >
        {tickets && <TicketPreview tickets={tickets} onDone={closeTickets} />}
      </OrderDetailsModal>
    </div>
  );
}
