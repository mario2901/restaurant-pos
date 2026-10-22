import styles from "./style/Tables.module.css";
import { REONS, SPECIAL_BLOCKS as SPECIAL } from "./data/Tables.js";
import { formatPrice } from "./data/menu.js";
import useTableOrders from "./hooks/useTableOrders.js";
import OrderDetailsDialog from "./OrderDetailsDialog.jsx";

const sumTotal = (orders) =>
  orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

export default function Tables({ reon, onReonChange, onSelectTable }) {
  const { ordersFor, isError, handleTableClick, dialogProps } =
    useTableOrders(onSelectTable);
  const activeReon = REONS.find((r) => r.id === reon) ?? REONS[0];

  return (
    <div>
      {isError && (
        <p className={styles.error}>Neuspješan dohvat stanja stolova</p>
      )}
      <div className={styles.special}>
        {SPECIAL.map((block) => {
          const orders = ordersFor(block.id);
          const isOccupied = orders.length > 0;

          return (
            <button
              key={block.id}
              className={`${styles.specialBtn} ${
                isOccupied ? styles.occupied : ""
              }`}
              // dostava / za ponijeti: svaki klik je nova narudžba za novog gosta
              onClick={() =>
                onSelectTable({ label: block.id, name: block.name, orders })
              }
            >
              <span className={styles.specialName}>{block.name}</span>
              {isOccupied ? (
                <span className={styles.meta}>
                  {orders.length}{" "}
                  {orders.length === 1 ? "otvorena" : "otvorene"} ·{" "}
                  {formatPrice(sumTotal(orders))}
                </span>
              ) : (
                block.hint && (
                  <span className={styles.specialHint}>{block.hint}</span>
                )
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.buttons}>
        {REONS.map((r) => {
          const occupiedCount = r.tables.filter(
            (t) => ordersFor(t.name).length > 0,
          ).length;

          return (
            <button
              key={r.id}
              className={reon === r.id ? styles.active : ""}
              onClick={() => onReonChange(r.id)}
            >
              {r.name}
              {occupiedCount > 0 && (
                <span className={styles.reonBadge}>{occupiedCount}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className={styles.tables}>
        {activeReon.tables.map((table) => {
          const orders = ordersFor(table.name);
          const isOccupied = orders.length > 0;

          return (
            <div key={table.id}>
              <button
                className={`${styles.tableBtn} ${
                  isOccupied ? styles.occupied : ""
                }`}
                onClick={() => handleTableClick(table.name, table.name)}
              >
                <span className={styles.tableName}>{table.name}</span>
                {isOccupied && (
                  <span className={styles.total}>
                    {formatPrice(sumTotal(orders))}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <OrderDetailsDialog {...dialogProps} />
    </div>
  );
}
