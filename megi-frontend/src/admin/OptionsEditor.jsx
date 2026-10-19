import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import ConfirmDelete from "./ConfirmDelete";
import {
  useAddOption,
  useDeleteOption,
  useUpdateOption,
} from "../hooks/useMenuAdmin";
import { parsePrice, priceInput } from "../data/menu";

function OptionRow({ option }) {
  const [name, setName] = useState(option.name);
  const [extra, setExtra] = useState(priceInput(option.extraPrice));
  const update = useUpdateOption();
  const remove = useDeleteOption();

  const parsed = extra.trim() === "" ? 0 : parsePrice(extra);
  const dirty =
    name.trim() !== option.name || parsed !== Number(option.extraPrice ?? 0);
  const valid = name.trim() && parsed >= 0;
  const error = update.error || remove.error;

  return (
    <li className={styles.rowItem}>
      <div className={styles.row}>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Opcija"
        />
        <input
          className={`${styles.input} ${styles.priceInput}`}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
        />
        {dirty && (
          <button
            type="button"
            className={`${styles.primary} ${styles.small}`}
            onClick={() =>
              update.mutate({
                id: option.id,
                name: name.trim(),
                extraPrice: parsed,
              })
            }
            disabled={!valid || update.isPending}
          >
            Spremi
          </button>
        )}
        <ConfirmDelete
          small
          label="×"
          isPending={remove.isPending}
          onConfirm={() => remove.mutate(option.id)}
        />
      </div>
      {/* porcija opcije se ne mijenja (backend PUT mijenja samo naziv i doplatu) */}
      <span className={styles.rowHint}>
        {option.portionSize ? `Samo uz: ${option.portionSize}` : "Sve porcije"}
      </span>
      {error && <p className={styles.error}>{error.message}</p>}
    </li>
  );
}

/** Opcije / dodaci uz jelo (npr. "Cijela lepina" uz malu porciju). */
export default function OptionsEditor({ food }) {
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [portionId, setPortionId] = useState("");
  const add = useAddOption();

  const parsed = extra.trim() === "" ? 0 : parsePrice(extra);
  const valid = name.trim() && parsed >= 0;
  const options = food.options ?? [];

  function handleAdd(e) {
    e.preventDefault();
    if (!valid) return;
    add.mutate(
      {
        foodId: food.id,
        name: name.trim(),
        extraPrice: parsed,
        portionId: portionId ? Number(portionId) : null,
      },
      {
        onSuccess: () => {
          setName("");
          setExtra("");
          setPortionId("");
        },
      },
    );
  }

  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>Opcije / dodaci</h4>
      {options.length === 0 ? (
        <p className={styles.muted}>Jelo nema opcija.</p>
      ) : (
        <ul className={styles.rows}>
          {options.map((o) => (
            <OptionRow
              key={`${o.id}-${o.name}-${o.extraPrice}`}
              option={o}
            />
          ))}
        </ul>
      )}

      <form className={styles.addBlock} onSubmit={handleAdd}>
        <div className={styles.row}>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nova opcija (npr. Cijela lepina)"
          />
          <input
            className={`${styles.input} ${styles.priceInput}`}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            inputMode="decimal"
            placeholder="+0,00"
          />
        </div>
        <div className={styles.row}>
          <select
            className={styles.input}
            value={portionId}
            onChange={(e) => setPortionId(e.target.value)}
          >
            <option value="">Vrijedi za sve porcije</option>
            {food.portions.map((p) => (
              <option key={p.id} value={p.id}>
                Samo uz: {p.size}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={`${styles.secondary} ${styles.small}`}
            disabled={!valid || add.isPending}
          >
            Dodaj
          </button>
        </div>
      </form>
      {add.error && <p className={styles.error}>{add.error.message}</p>}
    </section>
  );
}
