import { useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TbPrinterOff, TbRefresh, TbEye, TbX } from "react-icons/tb";
import styles from "./style/PrintAlerts.module.css";
import {
  PRINT_FAILED_KEY,
  useDismissPrint,
  usePrintFailures,
  useRetryPrint,
} from "./hooks/usePrintFailures";
import { OrderContext } from "./context/OrderContext";

const TYPE_LABEL = {
  KITCHEN: "Kuhinja",
  BAR: "Šank",
  BILL: "Račun",
  STORNO_KITCHEN: "Storno kuhinja",
  STORNO_BAR: "Storno šank",
  REPORT: "Izvještaj",
};

const time = (iso) =>
  new Date(iso).toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });

/** "Račun · STOL U2 #89, Kuhinja · DOSTAVA #90" */
function describe(tickets) {
  return tickets
    .map((t) => {
      const where =
        t.table === "DOSTAVA" || t.table === "PONIJETI"
          ? t.table
          : t.table
            ? `STOL ${t.table}`
            : "";
      return [TYPE_LABEL[t.type] ?? t.type, where, t.orderId ? `#${t.orderId}` : ""]
        .filter(Boolean)
        .join(" · ");
    })
    .join(", ");
}

function FailedJob({ job }) {
  const retry = useRetryPrint();
  const dismiss = useDismissPrint();
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const { showTickets } = useContext(OrderContext);

  return (
    <li className={styles.job}>
      <div className={styles.jobHead}>
        <TbPrinterOff size={20} className={styles.icon} />
        <div className={styles.jobText}>
          <strong>
            {job.printerLabel} printer nije ispisao
            <span className={styles.time}>
              {time(job.failedAt)}
              {job.attempts > 1 && ` · ${job.attempts}. pokušaj`}
            </span>
          </strong>
          <span className={styles.what}>{describe(job.tickets)}</span>
          <span className={styles.error}>
            {retry.isError ? retry.error.message : job.error}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.retry}
          onClick={() => retry.mutate(job.id)}
          disabled={retry.isPending || dismiss.isPending}
        >
          <TbRefresh size={16} />
          {retry.isPending ? "Šaljem…" : "Ponovi ispis"}
        </button>
        <button
          type="button"
          className={styles.ghost}
          // pregled + ispis kroz browser kao zadnja opcija
          onClick={() => showTickets(job.tickets)}
          title="Pregled tiketa"
        >
          <TbEye size={16} />
        </button>
        {confirmDismiss ? (
          <>
            <button
              type="button"
              className={styles.danger}
              onClick={() => dismiss.mutate(job.id)}
              disabled={dismiss.isPending}
            >
              Ukloni
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setConfirmDismiss(false)}
            >
              Ne
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.ghost}
            onClick={() => setConfirmDismiss(true)}
            title="Ukloni bez ispisa"
          >
            <TbX size={16} />
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Obavijest o tiketima koje printer nije ispisao (nema papira, otvoren poklopac,
 * ugašen, zapeo Windows red). Ostaje dok se tiket ne isprinta ili ne ukloni —
 * ne nestaje zatvaranjem prozora. Vidljiva na svim ekranima.
 */
export default function PrintAlerts() {
  const { data: jobs = [] } = usePrintFailures();
  const queryClient = useQueryClient();

  // OrderContext javlja neuspjeh odmah (bez čekanja 5 s na sljedeću provjeru)
  useEffect(() => {
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: PRINT_FAILED_KEY });
    window.addEventListener("megi:print-failed", refresh);
    return () => window.removeEventListener("megi:print-failed", refresh);
  }, [queryClient]);

  if (jobs.length === 0) return null;

  return (
    <aside className={styles.wrap} role="alert" aria-live="assertive">
      <ul className={styles.list}>
        {jobs.map((job) => (
          <FailedJob key={job.id} job={job} />
        ))}
      </ul>
    </aside>
  );
}
