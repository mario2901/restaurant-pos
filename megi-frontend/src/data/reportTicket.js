// data/reportTicket.js

const money = (v) => Number(v ?? 0).toFixed(2).replace(".", ",");

/**
 * Izvještaj (SalesReport ili DeliveryReport) -> REPORT tiket za print na šanku.
 *
 * Redovi:
 *  - prodani artikli (topItems) s iznosom — oni čine promet
 *  - stornirani artikli (stornoItems) s iznosom 0 — vide se, ali NE ulaze u UKUPNO;
 *    stvarna stornirana vrijednost piše u detalju reda
 * total = report.total (backend ga već računa bez storna)
 *
 * @param notice naslov na tiketu, npr. "DNEVNI IZVJEŠTAJ 18.10.2026."
 * @param table  veliki natpis ispod naslova (mjesto stola), npr. "DOSTAVA"; null = bez
 */
export function reportToTickets(report, notice = "DNEVNI IZVJEŠTAJ", table = null) {
  const sold = (report.topItems ?? []).map((row) => ({
    quantity: row.quantity,
    name: row.name,
    detail: null,
    lineTotal: row.total,
  }));

  const storno = (report.stornoItems ?? []).map((row) => ({
    quantity: row.quantity,
    name: `STORNO ${row.name}`,
    detail: `stornirano ${money(row.total)} KM - nije u prometu`,
    lineTotal: 0,
  }));

  return [
    {
      type: "REPORT",
      orderId: null,
      table,
      waiter: null,
      printedAt: new Date().toISOString(),
      notice,
      // obračun pića isključen -> jasno na papiru da piće nije u prometu
      orderNote:
        report.drinksIncluded === false
          ? "Piće nije uključeno u izvještaj"
          : null,
      takeaway: false,
      addition: false,
      lines: [...sold, ...storno],
      total: report.total,
    },
  ];
}

export const DELIVERY_REPORT_TITLE = "Dnevni izvještaj za Mišu šampiona";

/** Izvještaj dostave: posebni naslov + "DOSTAVA" na mjestu stola. */
export function deliveryReportToTickets(report, suffix = "") {
  const notice = suffix
    ? `${DELIVERY_REPORT_TITLE} ${suffix}`
    : DELIVERY_REPORT_TITLE;
  return reportToTickets(report, notice, "DOSTAVA");
}
