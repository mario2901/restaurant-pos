// data/reportTicket.js
export function reportToTickets(report) {
  return [
    {
      type: "REPORT",
      orderId: null,
      table: null,
      waiter: null,
      printedAt: new Date().toISOString(),
      notice: "DNEVNI IZVJEŠTAJ",
      orderNote: null,
      takeaway: false,
      lines: report.topItems.map((row) => ({
        quantity: row.quantity,
        name: row.name,
        detail: null,
        lineTotal: row.total,
      })),
      total: report.total,
    },
  ];
}
