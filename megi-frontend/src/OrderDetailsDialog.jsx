import { useCallback, useState } from "react";
import OrderDetailsModal from "./OrderDetailsModal";
import OrderDetails from "./OrderDetails";
import TransferSelect from "./TransferSelect";
import useStorno from "./hooks/useStorno";
import useChangeTable from "./hooks/useChangeTable";
import useMoveToTakeaway from "./hooks/useMoveToTakeaway";
import styles from "./style/OrderDetails.module.css";

const PACKED_TABLES = ["DOSTAVA", "PONIJETI"];

/**
 * Storno pravilo na frontendu:
 *  - otvorena narudžba (NEW): uvijek
 *  - zatvorena (DONE): DOSTAVA / PONIJETI, a u Profilu (allowDoneStorno) i stolovi
 * Backend dodatno dozvoljava DONE samo za današnji dan.
 */
const canStornoOrder = (order, allowDoneStorno) =>
  !!order &&
  (order.status === "NEW" ||
    (order.status === "DONE" &&
      (allowDoneStorno || PACKED_TABLES.includes(order.table))));

/** Prebacivanje: otvorena narudžba na stolu ili za ponijeti (dostava se ne premješta). */
const canTransferOrder = (order) =>
  !!order && order.status === "NEW" && order.table !== "DOSTAVA";

/** Modal s detaljima narudžbe + "Prebaci stol" i "Uredi" (storno) u headeru. */
export default function OrderDetailsDialog({
  order,
  title,
  onClose,
  onAddMore,
  onBill,
  isBilling,
  billError,
  canBill,
  allowDoneStorno = false,
}) {
  const [editing, setEditing] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const storno = useStorno();
  const changeTable = useChangeTable();
  const moveToTakeaway = useMoveToTakeaway();
  const { reset: resetStorno } = storno;
  const { reset: resetChange } = changeTable;
  const { reset: resetTakeaway } = moveToTakeaway;
  const canStorno = canStornoOrder(order, allowDoneStorno);
  const canTransfer = canTransferOrder(order);

  const handleClose = useCallback(() => {
    setEditing(false);
    setTransferOpen(false);
    resetStorno();
    resetChange();
    resetTakeaway();
    onClose();
  }, [onClose, resetStorno, resetChange, resetTakeaway]);

  function toggleEditing() {
    setEditing((e) => !e);
    resetStorno();
  }

  function toggleTransfer() {
    setTransferOpen((o) => !o);
    resetChange();
    resetTakeaway();
  }

  function handleMove(table) {
    resetTakeaway();
    changeTable.mutate(
      { orderId: order.id, table },
      { onSuccess: handleClose },
    );
  }

  function handleTakeaway() {
    resetChange();
    moveToTakeaway.mutate(
      { orderId: order.id, note: "" },
      { onSuccess: handleClose },
    );
  }

  const isMoving = changeTable.isPending || moveToTakeaway.isPending;
  const moveError = changeTable.error || moveToTakeaway.error;

  return (
    <OrderDetailsModal
      isOpen={!!order}
      onClose={handleClose}
      onTransfer={canTransfer ? toggleTransfer : undefined}
      transferOpen={transferOpen && canTransfer}
      transferControl={
        <TransferSelect
          showTakeaway={order?.table !== "PONIJETI"}
          onMove={handleMove}
          onTakeaway={handleTakeaway}
          disabled={isMoving}
        />
      }
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
      {moveError && (
        <p style={{ color: "#dc2626", margin: "0 0 12px", fontSize: 14 }}>
          {moveError.message}
        </p>
      )}
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
