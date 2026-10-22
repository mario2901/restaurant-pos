import styles from "../style/Mobile.module.css";
import { REONS, SPECIAL_BLOCKS } from "../data/Tables.js";
import { formatPrice } from "../data/menu.js";
import useTableOrders from "../hooks/useTableOrders.js";
import OrderDetailsDialog from "../OrderDetailsDialog.jsx";
import { BagIcon, TruckIcon } from "./icons.jsx";

const ICONS = { DOSTAVA: TruckIcon, PONIJETI: BagIcon };

const sumTotal = (orders) =>
  orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

const openLabel = (n) => `${n} ${n === 1 ? "otvorena" : "otvorene"}`;

/** Mobitel · Stolovi: reoni, Dostava / Za ponijeti, stolovi u 3 stupca. */
export default function MobileTables({ reon, onReonChange, onSelectTable }) {
  const { ordersFor, isError, handleTableClick, dialogProps } =
    useTableOrders(onSelectTable);
  const activeReon = REONS.find((r) => r.id === reon) ?? REONS[0];

  return (
    <>
      {isError && (
        <p className={styles.error}>Neuspješan dohvat stanja stolova</p>
      )}

      <div className={styles.reonWrap}>
        <div className={styles.segmented} role="tablist" aria-label="Reon">
          {REONS.map((r) => {
            const busy = r.tables.filter(
              (t) => ordersFor(t.name).length > 0,
            ).length;
            const active = r.id === activeReon.id;
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.segment} ${
                  active ? styles.segmentActive : ""
                }`}
                onClick={() => onReonChange(r.id)}
              >
                {r.name}
                <span className={styles.segmentCount}>{busy}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.special}>
        {SPECIAL_BLOCKS.map((block) => {
          const orders = ordersFor(block.id);
          const Icon = ICONS[block.id];
          return (
            <button
              key={block.id}
              type="button"
              className={`${styles.specialBtn} ${
                orders.length > 0 ? styles.specialOpen : ""
              }`}
              // svaki klik je nova narudžba za novog gosta
              onClick={() =>
                onSelectTable({ label: block.id, name: block.name, orders })
              }
            >
              <Icon className={styles.specialIcon} />
              <span className={styles.specialText}>
                <span className={styles.specialName}>{block.short}</span>
                <span className={styles.specialSub}>
                  {orders.length > 0
                    ? openLabel(orders.length)
                    : "Nova narudžba"}
                </span>
                {orders.length > 0 && (
                  <span className={styles.specialAmount}>
                    {formatPrice(sumTotal(orders))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.tables}>
        {activeReon.tables.map((table) => {
          const orders = ordersFor(table.name);
          const busy = orders.length > 0;
          return (
            <button
              key={table.id}
              type="button"
              className={`${styles.tableBtn} ${busy ? styles.tableBusy : ""}`}
              onClick={() => handleTableClick(table.name, table.name)}
            >
              <span className={styles.tableName}>{table.name}</span>
              <span className={styles.tableSub}>
                {busy ? formatPrice(sumTotal(orders)) : "slobodan"}
              </span>
            </button>
          );
        })}
      </div>

      <OrderDetailsDialog {...dialogProps} />
    </>
  );
}
