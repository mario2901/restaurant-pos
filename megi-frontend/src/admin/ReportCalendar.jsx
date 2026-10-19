import { useState } from "react";
import styles from "../style/AdminReports.module.css";
import {
  MONTHS,
  WEEKDAYS,
  fromDateKey,
  toDateKey,
  todayKey,
} from "../data/dates";

/**
 * Mjesečni kalendar (tjedan od ponedjeljka). Budući dani su onemogućeni.
 * @param value    odabrani dan "YYYY-MM-DD"
 * @param onChange (key) => void
 */
export default function ReportCalendar({ value, onChange }) {
  const selected = fromDateKey(value);
  // prikazani mjesec: { year, month } — prati odabrani dan kad se promijeni izvana
  const [view, setView] = useState({
    year: selected.getFullYear(),
    month: selected.getMonth(),
  });
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setView({ year: selected.getFullYear(), month: selected.getMonth() });
  }

  const today = todayKey();
  const now = new Date();
  const isCurrentMonth =
    view.year === now.getFullYear() && view.month === now.getMonth();

  // ćelije: prazne do prvog dana u tjednu (pon = 0), pa dani u mjesecu
  const first = new Date(view.year, view.month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateKey(new Date(view.year, view.month, i + 1)),
    ),
  ];

  function shiftMonth(delta) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calHeader}>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => shiftMonth(-1)}
          aria-label="Prethodni mjesec"
        >
          ‹
        </button>
        <span className={styles.calTitle}>
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          aria-label="Sljedeći mjesec"
        >
          ›
        </button>
      </div>

      <div className={styles.calGrid}>
        {WEEKDAYS.map((d) => (
          <span key={d} className={styles.calWeekday}>
            {d}
          </span>
        ))}
        {cells.map((key, i) =>
          key ? (
            <button
              key={key}
              type="button"
              className={`${styles.calDay} ${
                key === value ? styles.calSelected : ""
              } ${key === today ? styles.calToday : ""}`}
              onClick={() => onChange(key)}
              disabled={key > today}
            >
              {Number(key.slice(8))}
            </button>
          ) : (
            <span key={`empty-${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
