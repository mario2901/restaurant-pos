import styles from "./style/RightSideBarStyle.module.css";
import OrdersList from "./OrdersList";
import useOrders from "./hooks/useOrders";
import OrderDetailsDialog from "./OrderDetailsDialog";
import useBillOrder from "./hooks/useBillOrder";
import { useState, useCallback, useMemo, useContext } from "react";
import { OrderContext } from "./context/OrderContext";

// Sidebar prikazuje samo kuhinju: jela + dodaci (piće ide na šank)
const KITCHEN_TYPES = new Set(["FOOD", "ADDON"]);

const TABS = ["SVE", "STOLOVI", "DOSTAVA", "PONIJETI"];
const TAB_LABEL = {
  SVE: "Sve",
  STOLOVI: "Stolovi",
  DOSTAVA: "Dostava",
  PONIJETI: "Ponijeti",
};
const EMPTY_MESSAGE = {
  SVE: "Danas još nema narudžbi hrane.",
  STOLOVI: "Danas još nema narudžbi za stolove.",
  DOSTAVA: "Danas još nema dostava.",
  PONIJETI: "Danas još nema narudžbi za ponijeti.",
};

const PACKED_TABLES = new Set(["DOSTAVA", "PONIJETI"]);

// "SVE" propušta sve, "STOLOVI" sve osim dostave i za ponijeti,
// DOSTAVA / PONIJETI odgovaraju oznaci stola narudžbe
const matchesTab = (order, tab) => {
  if (tab === "SVE") return true;
  if (tab === "STOLOVI") return !PACKED_TABLES.has(order.table);
  return order.table === tab;
};

/**
 * Današnje narudžbe hrane s filterom Sve / Stolovi / Dostava / Ponijeti.
 * Desna traka na laptopu i tabletu, ekran "Narudžbe" na mobitelu.
 * title="" -> bez naslova (mobitel ima naslov u zaglavlju ekrana).
 */
export default function OrdersPanel({ title = "Narudžbe", className = "" }) {
  const { selectTable, showTickets } = useContext(OrderContext);
  const billOrder = useBillOrder();
  // čuva se samo id — narudžba se uvijek čita svježa iz liste (nakon storna / računa)
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("SVE");
  const setSelectedOrder = useCallback(
    (order) => setSelectedId(order ? order.id : null),
    [],
  );
  const { reset: resetBill } = billOrder;
  const { data: orders = [], isPending, error } = useOrders();
  // Modal uvijek dobija cijelu narudžbu (sa pićem) — Račun i "Dodaj još" je trebaju.
  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null;

  // Samo jela i dodaci; narudžbe koje imaju samo piće se ne prikazuju.
  const kitchenOrders = useMemo(
    () =>
      orders
        .map((order) => ({
          ...order,
          items: order.items.filter((i) => KITCHEN_TYPES.has(i.type)),
        }))
        .filter((order) => order.items.length > 0),
    [orders],
  );

  // Filter po tabu radi se nad već pripremljenom listom (bez novog poziva backendu)
  const visibleOrders = useMemo(
    () => kitchenOrders.filter((order) => matchesTab(order, selectedTab)),
    [kitchenOrders, selectedTab],
  );

  // broj narudžbi po tabu, za mali broj u svakom gumbu
  const tabCounts = useMemo(() => {
    const counts = {};
    for (const tab of TABS) {
      counts[tab] = kitchenOrders.filter((order) =>
        matchesTab(order, tab),
      ).length;
    }
    return counts;
  }, [kitchenOrders]);

  const closeDetails = useCallback(() => {
    setSelectedOrder(null);
    resetBill();
  }, [resetBill, setSelectedOrder]);

  function handleAddMore(order) {
    selectTable({
      label: order.table,
      name:
        order.table === "DOSTAVA"
          ? "Dostava"
          : order.table === "PONIJETI"
            ? "Za ponijeti"
            : order.table,
      orders: [order],
      orderId: order.id,
    });
    setSelectedOrder(null);
  }

  function handleBill(order) {
    // nakon uspjeha React Query osvježi stolove → sto nema narudžbu → modal se sam zatvori
    billOrder.mutate(order.id, {
      onSuccess: (result) => {
        setSelectedOrder(null);
        showTickets(result);
      },
    });
  }

  return (
    <>
      <div className={`${styles.orders} ${className}`}>
        <div className={styles.ordersHeader}>
          {title && <h3 className={styles.ordersTitle}>{title}</h3>}
          <div className={styles.tabs} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tab === selectedTab}
                className={`${styles.tab} ${
                  tab === selectedTab ? styles.tabActive : ""
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {TAB_LABEL[tab]}
                {tabCounts[tab] > 0 && (
                  <span className={styles.tabCount}>{tabCounts[tab]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <OrdersList
          // novi key po tabu -> limit se vraća na prvih 30
          key={selectedTab}
          pageSize={30}
          orders={visibleOrders}
          onSelect={setSelectedOrder}
          isPending={isPending}
          error={error}
          emptyText={EMPTY_MESSAGE[selectedTab]}
        />
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        title={selectedOrder?.table}
        onClose={closeDetails}
        onAddMore={handleAddMore}
        onBill={handleBill}
        isBilling={billOrder.isPending}
        billError={billOrder.error}
        canBill={PACKED_TABLES.has(selectedOrder?.table)}
      />
    </>
  );
}
