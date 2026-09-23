import styles from "./style/Tables.module.css";
import { useState } from "react";
import { unutra, terasa, kat } from "./data/Tables.js";
import useActiveOrders from "./hooks/useActiveOders.js";

const SPECIAL = [
  { id: "DOSTAVA", name: "Dostava Mišo šoMi", hint: "" },
  { id: "PONIJETI", name: "Za ponijeti", hint: "" },
];
const REONS = [
  { id: "unutra", name: "Unutra", tables: unutra },
  { id: "terasa", name: "Terasa", tables: terasa },
  { id: "kat", name: "Kat", tables: kat },
];
const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const sumTotal = (orders) =>
  orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

export default function Tables({ reon, onReonChange, onSelectTable }) {
  const { byTable, isError } = useActiveOrders();
  const activeReon = REONS.find((r) => r.id === reon) ?? REONS[0];
  const ordersFor = (label) => byTable[String(label)] ?? [];
  return (
    <div>
      {isError && (
        <p className={styles.error}>Neuspjesni dohvat stanja stola</p>
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
                onClick={() =>
                  onSelectTable({ label: table.name, name: table.name, orders })
                }
              >
                <span className={styles.tableName}>{table.name}</span>
                {isOccupied && (
                  <>
                    <span className={styles.total}>
                      {formatPrice(sumTotal(orders))}
                    </span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
