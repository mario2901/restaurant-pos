import styles from "./style/RightSideBarStyle.module.css";
import Order from "./Order";
import OrdersPanel from "./OrdersPanel";
import { useContext } from "react";
import { OrderContext } from "./context/OrderContext";

/** Desna traka (laptop i tablet): košarica odabranog stola + današnje narudžbe. */
export default function RightSideBar() {
  const { table, showTickets } = useContext(OrderContext);

  return (
    <aside className={styles.sidebar}>
      {table && (
        <Order
          key={`${table.label}-${table.orderId ?? "new"}`}
          table={table}
          orderId={table.orderId}
          onSent={showTickets}
        />
      )}
      <OrdersPanel />
    </aside>
  );
}
