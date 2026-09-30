import { useCallback, useState } from "react";
import OrderDetailsModal from "./OrderDetailsModal";
import OrderDetails from "./OrderDetails";
import useStorno from "./hooks/useStorno";
import styles from "./style/OrderDetails.module.css";

const PACKED_TABLES = ["DOSTAVA", "PONIJETI"];

/**
 * Storno pravilo na frontendu:
 *  - otvorena narudžba (NEW): uvijek
 *  - zatvorena (DONE): samo DOSTAVA / PONIJETI (zatvoreni stolovi dobit će
 *    zasebnu listu narudžbi s opcijom storna)
 * Backend dodatno dozvoljava DONE samo za današnji dan.
 */
const canStornoOrder = (order) =>
  !!order &&
  (order.status === "NEW" ||
    (order.status === "DONE" && PACKED_TABLES.includes(order.table)));

/** Modal s detaljima narudžbe + gumb "Uredi" (storno) u headeru. */
export default function OrderDetailsDialog({
  order,
  title,
  onClose,
  onAddMore,
  onBill,
  isBilling,
  billError,
  canBill,
}) {
  const [editing, setEditing] = useState(false);
  const storno = useStorno();
  const { reset: resetStorno } = storno;
  const canStorno = canStornoOrder(order);

  const handleClose = useCallback(() => {
    setEditing(false);
    resetStorno();
    onClose();
  }, [onClose, resetStorno]);

  function toggleEditing() {
    setEditing((e) => !e);
    resetStorno();
  }

  return (
    <OrderDetailsModal
      isOpen={!!order}
      onClose={handleClose}
      title={title}
      headerCenter={
        canStorno && (
          <button
            type="button"
            className={`${styles.editBtn} ${editing ? styles.editBtnActive : ""}`}
            onClick={toggleEditing}
          >
            {editing ? "Gotovo" : "Uredi"}
          </button>
        )
      }
    >
      {order && (
        <OrderDetails
          key={`${order.id}-${editing}`}
          order={order}
          onAddMore={onAddMore}
          onBill={onBill}
          isBilling={isBilling}
          error={billError}
          canBill={canBill}
          editing={editing && canStorno}
          storno={storno}
        />
      )}
    </OrderDetailsModal>
  );
}
