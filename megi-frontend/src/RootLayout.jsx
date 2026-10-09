// RootLayout.jsx
import { useContext } from "react";
import { Outlet } from "react-router";
import { OrderContext } from "./context/OrderContext.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";
import TicketPreview from "./TicketPreview.jsx";

export default function RootLayout() {
  const { tickets, closeTickets } = useContext(OrderContext);
  return (
    <>
      <Outlet />
      <OrderDetailsModal
        isOpen={!!tickets}
        onClose={closeTickets}
        title="Tiketi za print"
      >
        {tickets && <TicketPreview tickets={tickets} onDone={closeTickets} />}
      </OrderDetailsModal>
    </>
  );
}
