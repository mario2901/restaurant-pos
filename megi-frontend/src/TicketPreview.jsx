import { useRef, useState } from "react";
import styles from "./style/TicketPreview.module.css";

/*
 * Pregled tiketa koje vraća backend (Dto/Ticket.java):
 * { type: KITCHEN|BAR|BILL, orderId, table, waiter, printedAt,
 *   lines: [{ quantity, name, detail, lineTotal }], total, takeaway, notice,
 *   orderNote }   // orderNote = adresa/telefon za dostavu i za ponijeti
 *
 * Backend šalje JSON s non_null, pa total/detail/notice/waiter mogu nedostajati.
 * Stil papira je običan CSS string (TICKET_CSS) jer ga koristi i ekran i
 * iframe za print — CSS Modules klase se ne bi prenijele u iframe.
 */

const TYPE_LABEL = {
  KITCHEN: "KUHINJA",
  BAR: "ŠANK",
  BILL: "RAČUN",
  STORNO_KITCHEN: "STORNO KUHINJA",
  STORNO_BAR: "STORNO ŠANK",
};

// Tiketi bez cijena (kuhar ih ne treba)
const KITCHEN_TYPES = ["KITCHEN", "STORNO_KITCHEN"];

const TICKET_CSS = `
.tkt {
  width: 72mm;
  box-sizing: border-box;
  padding: 4mm 3mm;
  background: #fff;
  color: #000;
  font-family: "Courier New", Consolas, monospace;
  font-size: 13px;
  line-height: 1.35;
}
.tkt-title {
  margin: 0 0 2mm;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}
.tkt-notice {
  margin: 0 0 2mm;
  padding: 1mm 0;
  text-align: center;
  font-weight: 700;
  font-size: 15px;
  background: #000;
  color: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.tkt-meta {
  display: flex;
  justify-content: space-between;
  gap: 2mm;
}
.tkt-table {
  font-size: 17px;
  font-weight: 700;
}
.tkt-order-note {
  margin: 2mm 0 0;
  padding: 1.5mm 2mm;
  border: 2px solid #000;
  font-size: 15px;
  font-weight: 700;
  word-break: break-word;
}
.tkt-sep {
  border: none;
  border-top: 1px dashed #000;
  margin: 2mm 0;
}
.tkt-lines {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tkt-line {
  margin-bottom: 1.5mm;
}
.tkt-row {
  display: flex;
  gap: 2mm;
}
.tkt-qty {
  font-weight: 700;
  min-width: 7mm;
}
.tkt-name {
  flex: 1;
  font-weight: 700;
  word-break: break-word;
}
.tkt-kitchen .tkt-name,
.tkt-kitchen .tkt-qty {
  font-size: 15px;
}
.tkt-price {
  white-space: nowrap;
}
.tkt-detail {
  padding-left: 9mm;
  font-size: 12px;
}
.tkt-kitchen .tkt-detail {
  font-size: 14px;
  font-weight: 700;
}
.tkt-total {
  display: flex;
  justify-content: space-between;
  font-size: 17px;
  font-weight: 700;
}
.tkt-footer {
  margin-top: 3mm;
  text-align: center;
  font-size: 11px;
}
.tkt-page + .tkt-page {
  page-break-before: always;
  break-before: page;
}
`;

const formatPrice = (value) =>
  `${Number(value ?? 0).toFixed(2).replace(".", ",")} KM`;

const formatDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const tableLabel = (table) => {
  if (table === "DOSTAVA") return "DOSTAVA";
  if (table === "PONIJETI") return "ZA PONIJETI";
  return `STOL ${table ?? ""}`;
};

function TicketPaper({ ticket }) {
  const isKitchen = KITCHEN_TYPES.includes(ticket.type);
  const showPrices = !isKitchen;

  return (
    <div className={`tkt ${isKitchen ? "tkt-kitchen" : ""}`}>
      <p className="tkt-title">{TYPE_LABEL[ticket.type] ?? ticket.type}</p>

      {ticket.notice && <p className="tkt-notice">{ticket.notice}</p>}

      <div className="tkt-meta">
        <span className="tkt-table">{tableLabel(ticket.table)}</span>
        <span>#{ticket.orderId}</span>
      </div>
      <div className="tkt-meta">
        <span>{formatDateTime(ticket.printedAt)}</span>
        {ticket.waiter && <span>{ticket.waiter}</span>}
      </div>

      {ticket.orderNote && <p className="tkt-order-note">{ticket.orderNote}</p>}

      <hr className="tkt-sep" />

      <ul className="tkt-lines">
        {(ticket.lines ?? []).map((line, i) => (
          <li key={i} className="tkt-line">
            <div className="tkt-row">
              <span className="tkt-qty">{line.quantity}x</span>
              <span className="tkt-name">{line.name}</span>
              {showPrices && line.lineTotal != null && (
                <span className="tkt-price">{formatPrice(line.lineTotal)}</span>
              )}
            </div>
            {line.detail && <div className="tkt-detail">{line.detail}</div>}
          </li>
        ))}
      </ul>

      {ticket.total != null && (
        <>
          <hr className="tkt-sep" />
          <div className="tkt-total">
            <span>UKUPNO</span>
            <span>{formatPrice(ticket.total)}</span>
          </div>
        </>
      )}

      {ticket.type === "BILL" && (
        <p className="tkt-footer">
          Ovo nije fiskalni račun.
          <br />
          Hvala na posjeti!
        </p>
      )}
    </div>
  );
}

// Print kroz skriveni iframe: printa se samo papir, ne cijela aplikacija/modal.
function printHtml(innerHtml) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: 80mm auto; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
${TICKET_CSS}
</style>
</head>
<body>${innerHtml}</body>
</html>`);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.contentWindow.addEventListener("afterprint", cleanup);

  // mali delay da browser izračuna layout prije printa
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    cleanup();
  }, 50);
}

export default function TicketPreview({ tickets = [], onDone }) {
  const [active, setActive] = useState(0);
  const pageRefs = useRef([]);

  if (tickets.length === 0) {
    return <p className={styles.empty}>Nema tiketa za print.</p>;
  }

  const current = Math.min(active, tickets.length - 1);

  function wrap(html) {
    return `<div class="tkt-page">${html}</div>`;
  }

  function handlePrintCurrent() {
    const el = pageRefs.current[current];
    if (el) printHtml(wrap(el.innerHTML));
  }

  function handlePrintAll() {
    const html = pageRefs.current
      .slice(0, tickets.length)
      .filter(Boolean)
      .map((el) => wrap(el.innerHTML))
      .join("");
    printHtml(html);
  }

  return (
    <div className={styles.preview}>
      <style>{TICKET_CSS}</style>

      {tickets.length > 1 && (
        <div className={styles.tabs}>
          {tickets.map((t, i) => (
            <button
              key={`${t.type}-${i}`}
              type="button"
              className={`${styles.tab} ${i === current ? styles.tabActive : ""}`}
              onClick={() => setActive(i)}
            >
              {TYPE_LABEL[t.type] ?? t.type}
              <span className={styles.tabCount}>{t.lines?.length ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.paperWrap}>
        {/* Svi tiketi su renderani (zbog "Printaj sve"), vidljiv je samo aktivni */}
        {tickets.map((t, i) => (
          <div
            key={`${t.type}-${i}`}
            ref={(el) => (pageRefs.current[i] = el)}
            className={i === current ? styles.paper : styles.hidden}
          >
            <TicketPaper ticket={t} />
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {tickets.length > 1 ? (
          <>
            <button
              type="button"
              className={styles.secondary}
              onClick={handlePrintCurrent}
            >
              Printaj {TYPE_LABEL[tickets[current].type]?.toLowerCase()}
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={handlePrintAll}
            >
              Printaj sve
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.secondary}
              onClick={onDone}
            >
              Zatvori
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={handlePrintCurrent}
            >
              Printaj
            </button>
          </>
        )}
      </div>
    </div>
  );
}
