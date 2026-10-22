// data/reportTicket.js

const money = (v) => Number(v ?? 0).toFixed(2).replace(".", ",");

// Grupa artikla iz backenda (SalesRow.group); stari backend bez grupe -> hrana
const isDrink = (row) => row.group === "PICE";

const soldLine = (row) => ({
  quantity: row.quantity,
  name: row.name,
  detail: null,
  lineTotal: row.total,
});

const stornoLine = (row) => ({
  quantity: row.quantity,
  name: `STORNO ${row.name}`,
  detail: `stornirano ${money(row.total)} KM - nije u prometu`,
  lineTotal: 0,
});

/** Naslov grupe + prodano + storno + međuzbroj grupe. */
function section(title, sold, storno, subtotal) {
  return [
    { quantity: 0, name: title, detail: null, lineTotal: null, style: "SECTION" },
    ...sold.map(soldLine),
    ...storno.map(stornoLine),
    {
      quantity: 0,
      name: `${title} UKUPNO`,
      detail: null,
      lineTotal: subtotal,
      style: "SUBTOTAL",
    },
  ];
}

/**
 * Izvještaj (SalesReport ili DeliveryReport) -> REPORT tiket za print na šanku.
 *
 * Redoslijed:
 *   HRANA -> sva prodana hrana (jela + prilozi) -> storno hrane -> HRANA UKUPNO
 *   PIĆE  -> sve prodano piće -> storno pića -> PIĆE UKUPNO   (samo kad je obračun pića uključen)
 *   UKUPNO
 *
 * Stornirani artikli idu s iznosom 0 — vide se, ali NE ulaze u zbroj;
 * stvarna stornirana vrijednost piše u detalju reda.
 * total = report.total (backend ga već računa bez storna)
 *
 * @param notice naslov na tiketu, npr. "DNEVNI IZVJEŠTAJ 18.10.2026."
 * @param table  veliki natpis ispod naslova (mjesto stola), npr. "DOSTAVA"; null = bez
 */
export function reportToTickets(report, notice = "DNEVNI IZVJEŠTAJ", table = null) {
  const items = report.topItems ?? [];
  const storno = report.stornoItems ?? [];
  const drinksIncluded = report.drinksIncluded !== false;

  const foodTotal = Number(report.foodTotal ?? 0) + Number(report.addonTotal ?? 0);

  const lines = section(
    "HRANA",
    items.filter((r) => !isDrink(r)),
    storno.filter((r) => !isDrink(r)),
    foodTotal,
  );

  if (drinksIncluded) {
    lines.push(
      ...section(
        "PIĆE",
        items.filter(isDrink),
        storno.filter(isDrink),
        report.drinkTotal ?? 0,
      ),
    );
  }

  return [
    {
      type: "REPORT",
      orderId: null,
      table,
      waiter: null,
      printedAt: new Date().toISOString(),
      notice,
      orderNote: null,
      takeaway: false,
      addition: false,
      lines,
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
