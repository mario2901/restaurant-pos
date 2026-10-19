import { OrderContext } from "./context/OrderContext";
import styles from "./style/OrderItem.module.css";
import { useContext, useState } from "react";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const optionFitsPortion = (option, portion) =>
  option.portionId == null || option.portionId === portion?.id;

export default function OrderItem({ item, portion, onDone }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [counter, setCounter] = useState(1);
  const [note, setNote] = useState("");
  const { addItemToOrder } = useContext(OrderContext);

  const visibleOptions = (item.options ?? []).filter((o) =>
    optionFitsPortion(o, portion),
  );

  const activeOptions = selectedOptions.filter((o) =>
    optionFitsPortion(o, portion),
  );

  const optionsPrice = activeOptions.reduce(
    (sum, o) => sum + Number(o.extraPrice),
    0,
  );
  const total = (Number(portion.price) + optionsPrice) * counter;

  function toggleOption(option) {
    setSelectedOptions((prev) =>
      prev.some((o) => o.id === option.id)
        ? prev.filter((o) => o.id !== option.id)
        : [...prev, option],
    );
  }

  function handleAdd() {
    addItemToOrder({
      item,
      portion,
      type: "FOOD",
      amount: counter,
      options: activeOptions,
      note: note.trim(),
    });
    onDone?.();
  }

  return (
    <div className={styles.orderItem}>
      {visibleOptions.length > 0 && (
        <div className={styles.options}>
          <h4 className={styles.optionsTitle}>Opcija / Dodatak</h4>
          <div className={styles.optionList}>
            {visibleOptions.map((option) => {
              const active = activeOptions.some((o) => o.id === option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.optionBtn} ${
                    active ? styles.optionActive : ""
                  }`}
                  onClick={() => toggleOption(option)}
                >
                  <span>{option.name}</span>
                  {Number(option.extraPrice) > 0 && (
                    <span className={styles.price}>
                      +{formatPrice(option.extraPrice)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <input
        className={styles.note}
        placeholder="Napomena za kuhinju"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />

      <div className={styles.bottom}>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setCounter((c) => Math.max(1, c - 1))}
            disabled={counter <= 1}
            aria-label="Smanji količinu"
          >
            &minus;
          </button>
          <span className={styles.qty}>{counter}</span>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setCounter((c) => c + 1)}
            aria-label="Povećaj količinu"
          >
            +
          </button>
        </div>

        <button type="button" className={styles.addBtn} onClick={handleAdd}>
          <span>Dodaj</span>
          <span className={styles.addTotal}>{formatPrice(total)}</span>
        </button>
      </div>
    </div>
  );
}
