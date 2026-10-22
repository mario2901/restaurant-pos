import { useContext, useState } from "react";
import styles from "../style/Mobile.module.css";
import { OrderContext } from "../context/OrderContext.jsx";
import useOrders from "../hooks/useOrders.js";
import OrdersPanel from "../OrdersPanel.jsx";
import MobileHeader from "./MobileHeader.jsx";
import MobileNav from "./MobileNav.jsx";
import MobileTables from "./MobileTables.jsx";
import MobileMenu from "./MobileMenu.jsx";
import MobileCart from "./MobileCart.jsx";

const tableKey = (t) => (t ? `${t.label}-${t.orderId ?? "new"}` : null);

/**
 * Mobitel (≤ 700 px). Tok: Stolovi / Narudžbe (donja navigacija)
 * -> Meni odabranog stola -> Košarica -> Naruči -> natrag.
 * Košarica, stol i potvrda odbacivanja su isti OrderContext kao na laptopu,
 * pa okretanje uređaja usred narudžbe ništa ne gubi.
 */
export default function MobileApp({ reon, onReonChange, user, onProfile }) {
  const { table, selectTable, showTickets } = useContext(OrderContext);
  const [view, setView] = useState("tables");
  // košarica je otvorena za točno ovaj stol / narudžbu
  const [cartFor, setCartFor] = useState(null);
  const { data: orders = [] } = useOrders();
  const openCount = orders.filter((o) => o.status === "NEW").length;

  if (table) {
    const key = tableKey(table);
    if (cartFor === key) {
      return (
        <MobileCart
          key={key}
          table={table}
          onBack={() => setCartFor(null)}
          onSent={(result) => {
            setCartFor(null);
            showTickets(result);
          }}
        />
      );
    }
    return (
      <MobileMenu
        key={key}
        table={table}
        onBack={() => {
          setCartFor(null);
          selectTable(null);
        }}
        onOpenCart={() => setCartFor(key)}
      />
    );
  }

  return (
    <div className={styles.screen}>
      <MobileHeader
        title={view === "orders" ? "Narudžbe" : "Stolovi"}
        user={user}
        onProfile={onProfile}
      />
      <div className={styles.scroll}>
        {view === "tables" ? (
          <MobileTables
            reon={reon}
            onReonChange={onReonChange}
            onSelectTable={selectTable}
          />
        ) : (
          <div className={styles.ordersWrap}>
            <OrdersPanel title="" />
          </div>
        )}
      </div>
      <MobileNav
        view={view}
        onChange={setView}
        openCount={openCount}
        onProfile={onProfile}
      />
    </div>
  );
}
