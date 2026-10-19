// RootLayout.jsx
import { useContext } from "react";
import { Outlet } from "react-router";
import { OrderContext } from "./context/OrderContext.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";
import TicketPreview from "./TicketPreview.jsx";
import PrintAlerts from "./PrintAlerts.jsx";

export default function RootLayout() {
  const { tickets, printError, closeTickets } = useContext(OrderContext);
  return (
    <>
      <Outlet />
      {/* neisprintani tiketi — ostaju dok se ne isprintaju ili uklone */}
      <PrintAlerts />
      <OrderDetailsModal
        isOpen={!!tickets}
        onClose={closeTickets}
        title="Tiketi za print"
      >
        {tickets && (
          <TicketPreview
            tickets={tickets}
            initialError={printError}
            onDone={closeTickets}
          />
        )}
      </OrderDetailsModal>
    </>
  );
}
