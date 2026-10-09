import { createPortal } from "react-dom";
import styles from "./style/OrderDetailsModal.module.css";
import { useEffect } from "react";
import { BiTransfer } from "react-icons/bi";
import { IoClose } from "react-icons/io5";

export default function OrderDetailsModal({
  isOpen,
  onClose,
  onTransfer,
  transferOpen = false,
  transferControl = null,
  title,
  headerCenter,
  children,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>

          {onTransfer && (
            <div className={styles.transfer}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={onTransfer}
                aria-label="Prebaci stol"
                title="Prebaci stol"
              >
                <BiTransfer size={22} />
              </button>
              {transferOpen && transferControl}
            </div>
          )}

          <div className={styles.headerActions}>
            {headerCenter}
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Zatvori"
            >
              <IoClose size={24} />
            </button>
          </div>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
