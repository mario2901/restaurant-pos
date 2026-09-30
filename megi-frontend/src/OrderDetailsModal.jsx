import { createPortal } from "react-dom";
import styles from "./style/OrderDetailsModal.module.css";
import { useEffect } from "react";
export default function OrderDetailsModal({
  isOpen,
  onClose,
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
          <h2>{title}</h2>
          <div className={styles.headerCenter}>{headerCenter}</div>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Zatvori"
          >
            X
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
