import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import ConfirmDelete from "./ConfirmDelete";
import {
  useAddPortion,
  useDeletePortion,
  useUpdatePortion,
} from "../hooks/useMenuAdmin";
import { parsePrice, priceInput } from "../data/menu";

function PortionRow({ portion }) {
  const [size, setSize] = useState(portion.size);
  const [price, setPrice] = useState(priceInput(portion.price));
  const update = useUpdatePortion();
  const remove = useDeletePortion();

  const parsed = parsePrice(price);
  const dirty =
    size.trim() !== portion.size || parsed !== Number(portion.price);
  const valid = size.trim() && parsed > 0;
  const error = update.error || remove.error;

  function save() {
    update.mutate({ id: portion.id, size: size.trim(), price: parsed });
  }

  return (
    <li className={styles.rowItem}>
      <div className={styles.row}>
        <input
          className={styles.input}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Porcija"
        />
        <input
          className={`${styles.input} ${styles.priceInput}`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
        />
        {dirty && (
          <button
            type="button"
            className={`${styles.primary} ${styles.small}`}
            onClick={save}
            disabled={!valid || update.isPending}
          >
            Spremi
          </button>
        )}
        <ConfirmDelete
          small
          label="×"
          isPending={remove.isPending}
          onConfirm={() => remove.mutate(portion.id)}
        />
      </div>
      {error && <p className={styles.error}>{error.message}</p>}
    </li>
  );
}

/** Porcije postojećeg jela — svaka promjena odmah ide na backend. */
export default function PortionsEditor({ food }) {
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const add = useAddPortion();

  const parsed = parsePrice(price);
  const valid = size.trim() && parsed > 0;

  function handleAdd(e) {
    e.preventDefault();
    if (!valid) return;
    add.mutate(
      { foodId: food.id, size: size.trim(), price: parsed },
      {
        onSuccess: () => {
          setSize("");
          setPrice("");
        },
      },
    );
  }

  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>Porcije i cijene</h4>
      <ul className={styles.rows}>
        {food.portions.map((p) => (
          // key s cijenom: nakon spremanja input dobije svježu vrijednost
          <PortionRow key={`${p.id}-${p.size}-${p.price}`} portion={p} />
        ))}
      </ul>

      <form className={styles.row} onSubmit={handleAdd}>
        <input
          className={styles.input}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Nova porcija (npr. Velika)"
        />
        <input
          className={`${styles.input} ${styles.priceInput}`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
        />
        <button
          type="submit"
          className={`${styles.secondary} ${styles.small}`}
          disabled={!valid || add.isPending}
        >
          Dodaj
        </button>
      </form>
      {add.error && <p className={styles.error}>{add.error.message}</p>}
    </section>
  );
}
