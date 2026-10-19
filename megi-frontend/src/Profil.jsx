import styles from "./style/Profil.module.css";
import ProfilSideBar from "./ProfilSideBar";
import OrdersList from "./OrdersList";
import OrderDetailsDialog from "./OrderDetailsDialog";
import useOrders from "./hooks/useOrders";
import useBillOrder from "./hooks/useBillOrder";
import { useState, useCallback, useMemo, useContext } from "react";
import { OrderContext } from "./context/OrderContext";

const PACKED_TABLES = ["DOSTAVA", "PONIJETI"];

const TYPE_FILTERS = [
  { id: "SVE", label: "Sve" },
  { id: "STOLOVI", label: "Stolovi" },
  { id: "DOSTAVA", label: "Dostava" },
  { id: "PONIJETI", label: "Ponijeti" },
];

const matchesType = (order, type) => {
  if (type === "SVE") return true;
  if (type === "STOLOVI") return !PACKED_TABLES.includes(order.table);
  return order.table === type;
};

const tableName = (table) => {
  if (table === "DOSTAVA") return "dostava";
  if (table === "PONIJETI") return "za ponijeti";
  return `stol ${table}`;
};

// 1 otvorenu narudžbu, 2-4 otvorene narudžbe, 5+ otvorenih narudžbi
const openOrdersLabel = (n) => {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return "otvorenu narudžbu";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14))
    return "otvorene narudžbe";
  return "otvorenih narudžbi";
};

// Profil: današnje zatvorene (DONE) narudžbe, kompletne (hrana + piće).
// Klik otvara detalje s ponovnim printom računa i stornom.
export default function Profil() {
  const { showTickets } = useContext(OrderContext);
  const billOrder = useBillOrder();
  const { reset: resetBill } = billOrder;
  const { data: orders = [], isPending, error } = useOrders();
  // čuva se samo id — narudžba se uvijek čita svježa iz liste (nakon storna)
  const [selectedId, setSelectedId] = useState(null);
  const [type, setType] = useState("SVE");
  const [search, setSearch] = useState("");
  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null;

  const doneOrders = useMemo(
    () => orders.filter((order) => order.status === "DONE"),
    [orders],
  );

  // Pretraga po broju gleda sve zatvorene narudžbe (gost traži račun "#58"),
  // bez obzira na odabrani tab.
  const query = search.replace("#", "").trim();
  const visibleOrders = useMemo(
    () =>
      query
        ? doneOrders.filter((o) => String(o.id).includes(query))
        : doneOrders.filter((o) => matchesType(o, type)),
    [doneOrders, query, type],
  );

  // U smjeni je prijavljen jedan konobar, pa su sve otvorene narudžbe njegove —
  // podsjetnik da se zatvore prije auto-zatvaranja.
  const openOrders = useMemo(
    () => orders.filter((o) => o.status === "NEW"),
    [orders],
  );

  const closeDetails = useCallback(() => {
    setSelectedId(null);
    resetBill();
  }, [resetBill]);

  // Na zatvorenoj narudžbi backend "Račun" samo ponovo vraća račun (ništa ne mijenja)
  function handleReprint(order) {
    billOrder.mutate(order.id, {
      onSuccess: (result) => {
        setSelectedId(null);
        showTickets(result);
      },
    });
  }

  return (
    <div className={styles.page}>
      <ProfilSideBar />
      <main className={styles.content}>
        <h2 className={styles.title}>Zatvorene narudžbe</h2>

        {openOrders.length > 0 && (
          <div className={styles.warning} role="status">
            <strong>
              Imaš {openOrders.length} {openOrdersLabel(openOrders.length)}:{" "}
              {openOrders.map((o) => tableName(o.table)).join(", ")}
            </strong>
            <span className={styles.warningHint}>
              Otvorene narudžbe se automatski zatvaraju u 22:40 (dostava u
              15:30) — izdaj račune prije toga.
            </span>
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.segmented} role="tablist">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={filter.id === type}
                className={`${styles.segment} ${
                  filter.id === type ? styles.segmentActive : ""
                }`}
                onClick={() => setType(filter.id)}
                disabled={!!query}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            inputMode="numeric"
            className={styles.search}
            placeholder="Traži broj narudžbe"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <OrdersList
          orders={visibleOrders}
          onSelect={(order) => setSelectedId(order.id)}
          isPending={isPending}
          error={error}
          timeKey="closedAt"
          emptyText={
            query
              ? `Nema zatvorene narudžbe s brojem ${query}.`
              : "Nema zatvorenih narudžbi za odabrani filter."
          }
        />
      </main>

      <OrderDetailsDialog
        order={selectedOrder}
        title={selectedOrder?.table}
        onClose={closeDetails}
        onBill={handleReprint}
        isBilling={billOrder.isPending}
        billError={billOrder.error}
        canBill
        allowDoneStorno
      />
    </div>
  );
}
