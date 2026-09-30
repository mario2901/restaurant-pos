import { OrderContext } from "./context/OrderContext";
import styles from "./style/OrderItem.module.css";
import { useContext, useState } from "react";

const formatPrice = (price) =>
  `${Number(price).toFixed(2).replace(".", ",")} KM`;

const optionFitsPortion = (option, portion) =>
  option.portionId == null || option.portionId === portion?.id;

export default function OrderItem({ item, onBack }) {
  const [selectedPortion, setSelectedPortion] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [counter, setCounter] = useState(1);
  const [note, setNote] = useState("");
  const { addItemToOrder } = useContext(OrderContext);

  const visibleOptions = selectedPortion
    ? (item.options ?? []).filter((o) => optionFitsPortion(o, selectedPortion))
    : [];

  const optionsPrice = selectedOptions.reduce(
    (sum, o) => sum + Number(o.extraPrice),
    0,
  );
  const total = selectedPortion
    ? (Number(selectedPortion.price) + optionsPrice) * counter
    : 0;

  function handleSelectPortion(portion) {
    if (selectedPortion?.id === portion.id) return;
    setSelectedPortion(portion);
    // izbaci opcije koje ne vrijede za novu porciju

    setCounter(1);
    setSelectedOptions((prev) =>
      prev.filter((o) => optionFitsPortion(o, portion)),
    );
  }

  function toggleOption(option) {
    setSelectedOptions((prev) =>
      prev.some((o) => o.id === option.id)
        ? prev.filter((o) => o.id !== option.id)
        : [...prev, option],
    );
  }

  function handleAdd() {
    if (!selectedPortion) return;
    addItemToOrder({
      item,
      portion: selectedPortion,
      type: "FOOD",
      options: selectedOptions,
      note,
    });

    onBack?.();
  }

  return (
    <div className={styles.orderItem}>
      <h3>{item.name}</h3>
      <button className={styles.closeBtn} onClick={onBack}>
        X
      </button>

      <div className={styles.portions}>
        {item.portions?.map((portion) => (
          <button
            key={portion.id}
            type="button"
            className={`${styles.portionBtn} ${
              selectedPortion?.id === portion.id ? styles.portionActive : ""
            }`}
            onClick={() => handleSelectPortion(portion)}
          >
            <span>{portion.size}</span>
            <span className={styles.price}>{formatPrice(portion.price)}</span>
          </button>
        ))}
      </div>

      {visibleOptions.length > 0 && (
        <div className={styles.options}>
          <h4 className={styles.optionsTitle}>Opcija / Dodatak</h4>
          <div className={styles.portions}>
            {visibleOptions.map((option) => {
              const active = selectedOptions.some((o) => o.id === option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.portionBtn} ${
                    active ? styles.portionActive : ""
                  }`}
                  onClick={() => toggleOption(option)}
                >
                  <span>{option.name}</span>
                  <span className={styles.price}>
                    {formatPrice(option.extraPrice)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.bottom}>
        {selectedPortion && (
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
        )}

        <input
          className={styles.note}
          placeholder="Napomena za kuhinju"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          type="button"
          className={styles.addBtn}
          disabled={!selectedPortion}
          onClick={handleAdd}
        >
          {selectedPortion ? `Dodaj - ${formatPrice(total)}` : "Dodaj"}
        </button>
      </div>
    </div>
  );
}
